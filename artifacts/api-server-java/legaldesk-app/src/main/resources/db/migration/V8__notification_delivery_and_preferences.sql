CREATE TABLE notification_preferences (
 user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 site_enabled BOOLEAN NOT NULL DEFAULT TRUE, email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 browser_enabled BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE notifications ADD COLUMN site_visible BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX notifications_user_created_idx ON notifications(user_id,created_at DESC);
CREATE TABLE push_subscriptions (
 id BIGSERIAL PRIMARY KEY,user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 endpoint TEXT NOT NULL UNIQUE,p256dh TEXT NOT NULL,auth TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE notification_delivery (
 id BIGSERIAL PRIMARY KEY,notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
 channel TEXT NOT NULL CHECK(channel IN ('email','browser')),subscription_id BIGINT REFERENCES push_subscriptions(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed','skipped')),
 attempts INTEGER NOT NULL DEFAULT 0,next_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),last_error TEXT,sent_at TIMESTAMPTZ
);
CREATE INDEX notification_delivery_pending_idx ON notification_delivery(next_attempt) WHERE status IN ('pending','sending');
CREATE TABLE office_email_settings (
 id INTEGER PRIMARY KEY CHECK(id=1),enabled BOOLEAN NOT NULL DEFAULT FALSE,
 host TEXT NOT NULL DEFAULT '',port INTEGER NOT NULL DEFAULT 587 CHECK(port BETWEEN 1 AND 65535),
 username TEXT NOT NULL DEFAULT '',password_encrypted TEXT NOT NULL DEFAULT '',
 from_address TEXT NOT NULL DEFAULT '',tls_mode TEXT NOT NULL DEFAULT 'starttls' CHECK(tls_mode IN ('starttls','ssl'))
);
INSERT INTO office_email_settings(id) VALUES(1);
CREATE TABLE notification_vapid (
 id INTEGER PRIMARY KEY CHECK(id=1),public_key TEXT NOT NULL,private_key TEXT NOT NULL
);
CREATE FUNCTION send_user_notification(recipient BIGINT,kind TEXT,heading TEXT,message TEXT,reference_id BIGINT,reference_type TEXT) RETURNS VOID AS $$
DECLARE n BIGINT; p RECORD;
BEGIN
 IF recipient IS NULL OR NOT EXISTS(SELECT 1 FROM users WHERE id=recipient AND active) THEN RETURN; END IF;
 INSERT INTO notification_preferences(user_id) VALUES(recipient) ON CONFLICT DO NOTHING;
 SELECT * INTO p FROM notification_preferences WHERE user_id=recipient;
 IF NOT(p.site_enabled OR p.email_enabled OR p.browser_enabled) THEN RETURN; END IF;
 INSERT INTO notifications(user_id,type,title,body,ref_id,ref_type,site_visible)
 VALUES(recipient,kind,heading,message,reference_id,reference_type,p.site_enabled) RETURNING id INTO n;
 IF p.email_enabled AND EXISTS(SELECT 1 FROM office_email_settings WHERE enabled) THEN INSERT INTO notification_delivery(notification_id,channel) VALUES(n,'email'); END IF;
 IF p.browser_enabled THEN INSERT INTO notification_delivery(notification_id,channel,subscription_id)
 SELECT n,'browser',id FROM push_subscriptions WHERE user_id=recipient; END IF;
END; $$ LANGUAGE plpgsql;
CREATE FUNCTION notify_case_people(case_key BIGINT,kind TEXT,heading TEXT,message TEXT) RETURNS VOID AS $$
DECLARE recipient BIGINT;
BEGIN
 FOR recipient IN SELECT DISTINCT u.id FROM users u WHERE u.active AND
 (u.role IN ('admin','owner') OR u.id=(SELECT lead_lawyer_id FROM cases WHERE id=case_key)
 OR u.id=(SELECT cl.user_id FROM clients cl JOIN cases c ON c.client_id=cl.id WHERE c.id=case_key)) LOOP
 PERFORM send_user_notification(recipient,kind,heading,message,case_key,'case');
 END LOOP;
END; $$ LANGUAGE plpgsql;
CREATE FUNCTION notify_office(kind TEXT,heading TEXT,message TEXT,reference_id BIGINT,reference_type TEXT) RETURNS VOID AS $$
DECLARE recipient BIGINT;
BEGIN
 FOR recipient IN SELECT id FROM users WHERE active AND role IN ('admin','owner') LOOP
 PERFORM send_user_notification(recipient,kind,heading,message,reference_id,reference_type);
 END LOOP;
END; $$ LANGUAGE plpgsql;
CREATE FUNCTION notify_business_event() RETURNS TRIGGER AS $$
DECLARE recipient BIGINT; client_user BIGINT; case_key BIGINT;
BEGIN
 IF TG_TABLE_NAME='consultation_requests' THEN
  PERFORM notify_office('consultation','استشارة جديدة','يوجد طلب استشارة جديد يحتاج إلى مراجعة.',NEW.id,'consultation');
 ELSIF TG_TABLE_NAME='consultation_assignees' THEN
  PERFORM send_user_notification(NEW.user_id,'consultation','تم إسناد استشارة إليك','يمكنك مراجعة الاستشارة والرد عليها من حسابك.',NEW.request_id,'consultation');
 ELSIF TG_TABLE_NAME='consultation_messages' THEN
  IF NEW.sender_type='staff' THEN
   SELECT cl.user_id INTO client_user FROM clients cl JOIN consultation_requests q ON q.client_id=cl.id WHERE q.id=NEW.request_id;
   PERFORM send_user_notification(client_user,'consultation','رد جديد على استشارتك','يوجد رد جديد، سجّل الدخول للاطلاع عليه.',NEW.request_id,'consultation');
  ELSE
   FOR recipient IN SELECT DISTINCT u.id FROM users u WHERE u.active AND
    (u.role IN ('admin','owner') OR u.id IN(SELECT user_id FROM consultation_assignees WHERE request_id=NEW.request_id)) LOOP
    PERFORM send_user_notification(recipient,'consultation','متابعة جديدة للاستشارة','يوجد رد جديد من صاحب الاستشارة.',NEW.request_id,'consultation');
   END LOOP;
  END IF;
 ELSIF TG_TABLE_NAME='cases' THEN
  IF TG_OP='INSERT' THEN PERFORM notify_case_people(NEW.id,'case','قضية جديدة','تمت إضافة قضية إلى حسابك.');
  ELSIF OLD.status IS DISTINCT FROM NEW.status OR OLD.lead_lawyer_id IS DISTINCT FROM NEW.lead_lawyer_id THEN
   PERFORM notify_case_people(NEW.id,'case','تحديث القضية','تم تحديث حالة القضية أو المحامي المسؤول.');
  END IF;
 ELSIF TG_TABLE_NAME='case_updates' THEN
  PERFORM notify_case_people(NEW.case_id,'case','تحديث تقدم القضية','تم نشر تحديث جديد على القضية.');
 ELSIF TG_TABLE_NAME='hearings' THEN
  IF TG_OP='INSERT' THEN PERFORM notify_case_people(NEW.case_id,'hearing','جلسة جديدة','تمت إضافة جلسة، راجع موعدها في حسابك.');
  ELSIF OLD.datetime IS DISTINCT FROM NEW.datetime OR OLD.status IS DISTINCT FROM NEW.status OR OLD.court IS DISTINCT FROM NEW.court THEN
   PERFORM notify_case_people(NEW.case_id,'hearing','تحديث الجلسة','تم تحديث موعد الجلسة أو بياناتها.');
  END IF;
 ELSIF TG_TABLE_NAME='payments' THEN
  SELECT user_id INTO client_user FROM clients WHERE id=NEW.client_id;
  IF TG_OP='INSERT' THEN PERFORM send_user_notification(client_user,'payment','طلب دفع جديد','يوجد طلب دفع جديد في حسابك.',NEW.id,'payment');
  ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('paid','pending','overdue') THEN
   PERFORM send_user_notification(client_user,'payment','تحديث حالة الدفع','تم تحديث حالة طلب الدفع، راجع التفاصيل في حسابك.',NEW.id,'payment');
  END IF;
 ELSIF TG_TABLE_NAME='payment_receipts' THEN
  IF TG_OP='INSERT' THEN PERFORM notify_office('payment','إيصال يحتاج للمراجعة','تم رفع إيصال تحويل جديد.',NEW.payment_id,'payment'); END IF;
 ELSIF TG_TABLE_NAME='documents' THEN
  IF NEW.case_id IS NOT NULL AND NEW.content IS NOT NULL THEN PERFORM notify_case_people(NEW.case_id,'case','مرفقات جديدة','تمت إضافة مرفقات جديدة للقضية.'); END IF;
 ELSIF TG_TABLE_NAME='tasks' THEN
  IF TG_OP='INSERT' THEN PERFORM send_user_notification(NEW.assigned_to,'task','مهمة جديدة','تم إسناد مهمة إليك.',NEW.id,'task');
  ELSIF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to OR OLD.status IS DISTINCT FROM NEW.status THEN
   PERFORM send_user_notification(NEW.assigned_to,'task','تحديث المهمة','تم تحديث مهمة مسندة إليك.',NEW.id,'task');
  END IF;
 END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER notification_request AFTER INSERT ON consultation_requests FOR EACH ROW EXECUTE FUNCTION notify_business_event();
CREATE TRIGGER notification_assignment AFTER INSERT ON consultation_assignees FOR EACH ROW EXECUTE FUNCTION notify_business_event();
CREATE TRIGGER notification_message AFTER INSERT ON consultation_messages FOR EACH ROW EXECUTE FUNCTION notify_business_event();
CREATE TRIGGER notification_case AFTER INSERT OR UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION notify_business_event();
CREATE TRIGGER notification_progress AFTER INSERT ON case_updates FOR EACH ROW EXECUTE FUNCTION notify_business_event();
CREATE TRIGGER notification_hearing AFTER INSERT OR UPDATE ON hearings FOR EACH ROW EXECUTE FUNCTION notify_business_event();
CREATE TRIGGER notification_payment AFTER INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION notify_business_event();
CREATE TRIGGER notification_receipt AFTER INSERT ON payment_receipts FOR EACH ROW EXECUTE FUNCTION notify_business_event();
CREATE TRIGGER notification_document AFTER INSERT ON documents FOR EACH ROW EXECUTE FUNCTION notify_business_event();
CREATE TRIGGER notification_task AFTER INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION notify_business_event();
