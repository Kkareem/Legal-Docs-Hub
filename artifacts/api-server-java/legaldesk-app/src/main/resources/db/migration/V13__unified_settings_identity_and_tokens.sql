CREATE TABLE settings(name TEXT PRIMARY KEY,value JSONB NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
INSERT INTO settings SELECT 'office.email',to_jsonb(e)-'id',NOW() FROM office_email_settings e;
INSERT INTO settings SELECT 'office.bank',to_jsonb(b)-'id',NOW() FROM office_bank_details b;
INSERT INTO settings SELECT 'notifications.vapid',to_jsonb(v)-'id',NOW() FROM notification_vapid v;
INSERT INTO settings SELECT 'notifications.user.'||user_id,to_jsonb(p)-'user_id',NOW() FROM notification_preferences p;
INSERT INTO settings VALUES('auth.session', '{"durationMinutes":60}',NOW());
ALTER TABLE users ADD COLUMN national_id VARCHAR(14),ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
UPDATE users u SET national_id=c.national_id FROM clients c WHERE c.user_id=u.id AND c.national_id ~ '^[0-9]{14}$' AND NOT EXISTS(SELECT 1 FROM clients x WHERE x.id<>c.id AND x.national_id=c.national_id);
-- Only the two known development seed accounts receive demo identifiers. Real legacy users remain unset until the office records their identity.
UPDATE users SET national_id='00000000000001' WHERE national_id IS NULL AND email='admin@legaldesk.sa';
UPDATE users SET national_id='00000000000002' WHERE national_id IS NULL AND email='sara@legaldesk.sa';
ALTER TABLE users ADD CONSTRAINT users_national_id_format CHECK(national_id IS NULL OR national_id ~ '^[0-9]{14}$');
CREATE UNIQUE INDEX users_national_id_unique ON users(national_id);
UPDATE users SET email=NULL WHERE trim(email)='';
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users(lower(email)) WHERE email IS NOT NULL;
CREATE TABLE auth_revoked_tokens(jti TEXT PRIMARY KEY,expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE consultation_verifications(id UUID PRIMARY KEY,contact TEXT NOT NULL,channel TEXT NOT NULL,ip_hash TEXT NOT NULL,code_hash TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,expires_at TIMESTAMPTZ NOT NULL,verified BOOLEAN NOT NULL DEFAULT FALSE,access_hash TEXT,access_expires_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX consultation_verification_contact_idx ON consultation_verifications(contact,created_at);
CREATE INDEX consultation_verification_ip_idx ON consultation_verifications(ip_hash,created_at);
ALTER TABLE consultation_requests ALTER COLUMN email DROP NOT NULL;
ALTER TABLE consultation_requests ALTER COLUMN phone DROP NOT NULL;
CREATE OR REPLACE FUNCTION send_user_notification(recipient BIGINT,kind TEXT,heading TEXT,message TEXT,reference_id BIGINT,reference_type TEXT) RETURNS VOID AS $$
DECLARE n BIGINT; p JSONB;
BEGIN
 IF recipient IS NULL OR NOT EXISTS(SELECT 1 FROM users WHERE id=recipient AND active) THEN RETURN; END IF;
 INSERT INTO settings(name,value) VALUES('notifications.user.'||recipient,'{"site_enabled":true,"email_enabled":true,"browser_enabled":false}') ON CONFLICT DO NOTHING;
 SELECT value INTO p FROM settings WHERE name='notifications.user.'||recipient;
 IF NOT((p->>'site_enabled')::boolean OR (p->>'email_enabled')::boolean OR (p->>'browser_enabled')::boolean) THEN RETURN; END IF;
 INSERT INTO notifications(user_id,type,title,body,ref_id,ref_type,site_visible) VALUES(recipient,kind,heading,message,reference_id,reference_type,(p->>'site_enabled')::boolean) RETURNING id INTO n;
 IF (p->>'email_enabled')::boolean AND EXISTS(SELECT 1 FROM users WHERE id=recipient AND email IS NOT NULL) AND EXISTS(SELECT 1 FROM settings WHERE name='office.email' AND (value->>'enabled')::boolean) THEN INSERT INTO notification_delivery(notification_id,channel) VALUES(n,'email'); END IF;
 IF (p->>'browser_enabled')::boolean THEN INSERT INTO notification_delivery(notification_id,channel,subscription_id) SELECT n,'browser',id FROM push_subscriptions WHERE user_id=recipient; END IF;
END; $$ LANGUAGE plpgsql;
DROP TABLE office_email_settings;
DROP TABLE office_bank_details;
DROP TABLE notification_vapid;
DROP TABLE notification_preferences;

CREATE FUNCTION remove_user_settings() RETURNS TRIGGER AS $$ BEGIN DELETE FROM settings WHERE name='notifications.user.'||OLD.id;RETURN OLD;END; $$ LANGUAGE plpgsql;
CREATE TRIGGER user_settings_cleanup AFTER DELETE ON users FOR EACH ROW EXECUTE FUNCTION remove_user_settings();
