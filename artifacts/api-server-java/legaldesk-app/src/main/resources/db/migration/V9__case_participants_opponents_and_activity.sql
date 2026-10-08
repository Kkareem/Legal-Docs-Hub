CREATE TABLE case_clients(case_id BIGINT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,client_id BIGINT NOT NULL REFERENCES clients(id),PRIMARY KEY(case_id,client_id));
CREATE INDEX case_clients_client_idx ON case_clients(client_id,case_id);
CREATE TABLE case_lawyers(case_id BIGINT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,user_id BIGINT NOT NULL REFERENCES users(id),PRIMARY KEY(case_id,user_id));
CREATE INDEX case_lawyers_user_idx ON case_lawyers(user_id,case_id);
INSERT INTO case_clients SELECT c.id,c.client_id FROM cases c JOIN clients cl ON cl.id=c.client_id;
INSERT INTO case_lawyers SELECT c.id,c.lead_lawyer_id FROM cases c JOIN users u ON u.id=c.lead_lawyer_id;
CREATE TABLE case_opponents(id BIGSERIAL PRIMARY KEY,case_id BIGINT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
 name TEXT,phone TEXT,email TEXT,national_id TEXT,relationship TEXT,related_client_id BIGINT REFERENCES clients(id),notes TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
INSERT INTO case_opponents(case_id,name) SELECT id,opposing_party FROM cases WHERE NULLIF(TRIM(opposing_party),'') IS NOT NULL;
CREATE INDEX case_opponents_case_idx ON case_opponents(case_id,id);
ALTER TABLE case_reviews DROP CONSTRAINT case_reviews_case_id_key;
ALTER TABLE case_reviews ADD CONSTRAINT case_reviews_client_lawyer_unique UNIQUE(case_id,client_id,lawyer_id);
-- Keep history after deleting a case; no writable activity API is provided.
CREATE TABLE case_activity(id BIGSERIAL PRIMARY KEY,case_id BIGINT NOT NULL,actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
 actor_name TEXT NOT NULL,entity TEXT NOT NULL,entity_id BIGINT,action TEXT NOT NULL,changes JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX case_activity_case_idx ON case_activity(case_id,id DESC);
CREATE FUNCTION case_primary_members() RETURNS TRIGGER AS $$ BEGIN
 INSERT INTO case_clients(case_id,client_id) VALUES(NEW.id,NEW.client_id) ON CONFLICT DO NOTHING;
 IF NEW.lead_lawyer_id IS NOT NULL THEN INSERT INTO case_lawyers(case_id,user_id) VALUES(NEW.id,NEW.lead_lawyer_id) ON CONFLICT DO NOTHING; END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER case_primary_members AFTER INSERT OR UPDATE OF client_id,lead_lawyer_id ON cases FOR EACH ROW EXECUTE FUNCTION case_primary_members();
CREATE OR REPLACE FUNCTION notify_case_people(case_key BIGINT,kind TEXT,heading TEXT,message TEXT) RETURNS VOID AS $$
DECLARE recipient BIGINT; BEGIN
 FOR recipient IN SELECT DISTINCT u.id FROM users u WHERE u.active AND
 (u.role IN ('admin','owner') OR u.id IN(SELECT user_id FROM case_lawyers WHERE case_id=case_key)
 OR u.id IN(SELECT cl.user_id FROM clients cl JOIN case_clients cc ON cc.client_id=cl.id WHERE cc.case_id=case_key)) LOOP
 PERFORM send_user_notification(recipient,kind,heading,message,case_key,'case'); END LOOP;
END; $$ LANGUAGE plpgsql;
CREATE FUNCTION notify_new_case_member() RETURNS TRIGGER AS $$ DECLARE recipient BIGINT; BEGIN
 IF TG_TABLE_NAME='case_clients' THEN SELECT user_id INTO recipient FROM clients WHERE id=NEW.client_id; ELSE recipient=NEW.user_id; END IF;
 PERFORM send_user_notification(recipient,'case','تم ربطك بقضية','يمكنك متابعة القضية من حسابك.',NEW.case_id,'case');
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER notify_case_client AFTER INSERT ON case_clients FOR EACH ROW EXECUTE FUNCTION notify_new_case_member();
CREATE TRIGGER notify_case_lawyer AFTER INSERT ON case_lawyers FOR EACH ROW EXECUTE FUNCTION notify_new_case_member();
CREATE FUNCTION record_case_activity() RETURNS TRIGGER AS $$
DECLARE previous JSONB; following JSONB; row_data JSONB; delta JSONB; field TEXT; case_key BIGINT; actor BIGINT; actor_label TEXT; record_key BIGINT;
BEGIN
 IF TG_TABLE_NAME='documents' THEN
  IF TG_OP<>'INSERT' THEN previous=jsonb_build_object('id',OLD.id,'case_id',OLD.case_id,'client_id',OLD.client_id,'file_name',OLD.file_name,'file_size',OLD.file_size,'doc_type',OLD.doc_type,'notes',OLD.notes,'uploaded_by',OLD.uploaded_by); END IF;
  IF TG_OP<>'DELETE' THEN following=jsonb_build_object('id',NEW.id,'case_id',NEW.case_id,'client_id',NEW.client_id,'file_name',NEW.file_name,'file_size',NEW.file_size,'doc_type',NEW.doc_type,'notes',NEW.notes,'uploaded_by',NEW.uploaded_by); END IF;
 ELSE
  IF TG_OP<>'INSERT' THEN previous=to_jsonb(OLD)-ARRAY['created_at','updated_at','tracking_token']; END IF;
  IF TG_OP<>'DELETE' THEN following=to_jsonb(NEW)-ARRAY['created_at','updated_at','tracking_token']; END IF;
 END IF;
 row_data=COALESCE(following,previous);record_key=(row_data->>'id')::BIGINT;
 IF TG_TABLE_NAME='cases' THEN case_key=record_key;
 ELSIF TG_TABLE_NAME='payment_receipts' THEN SELECT case_id INTO case_key FROM payments WHERE id=(row_data->>'payment_id')::BIGINT;
 ELSIF TG_TABLE_NAME='consultation_messages' THEN SELECT case_id INTO case_key FROM consultation_requests WHERE id=(row_data->>'request_id')::BIGINT;
 ELSE case_key=(row_data->>'case_id')::BIGINT; END IF;
 IF case_key IS NULL THEN RETURN COALESCE(NEW,OLD); END IF;
 IF TG_TABLE_NAME='case_clients' THEN
  row_data=row_data||jsonb_build_object('client_name',(SELECT name FROM clients WHERE id=(row_data->>'client_id')::BIGINT));
 ELSIF TG_TABLE_NAME='case_lawyers' THEN
  row_data=row_data||jsonb_build_object('lawyer_name',(SELECT name FROM users WHERE id=(row_data->>'user_id')::BIGINT));
 END IF;
 delta='{}'::JSONB;
 FOR field IN SELECT DISTINCT k FROM jsonb_object_keys(COALESCE(previous,'{}')||COALESCE(following,'{}')) k LOOP
  IF previous->field IS DISTINCT FROM following->field THEN delta=delta||jsonb_build_object(field,jsonb_build_object('before',previous->field,'after',following->field)); END IF;
 END LOOP;
 IF delta='{}'::JSONB THEN RETURN COALESCE(NEW,OLD); END IF;
 IF row_data ? 'client_name' THEN delta=delta||jsonb_build_object('client_name',jsonb_build_object('before',NULL,'after',row_data->'client_name')); END IF;
 IF row_data ? 'lawyer_name' THEN delta=delta||jsonb_build_object('lawyer_name',jsonb_build_object('before',NULL,'after',row_data->'lawyer_name')); END IF;
 actor=NULLIF(current_setting('app.actor_id',TRUE),'')::BIGINT;
 SELECT name INTO actor_label FROM users WHERE id=actor;
 actor_label=COALESCE(actor_label,CASE WHEN TG_TABLE_NAME='consultation_messages' AND row_data->>'sender_type'='visitor' THEN 'زائر' ELSE 'النظام' END);
 INSERT INTO case_activity(case_id,actor_id,actor_name,entity,entity_id,action,changes) VALUES(case_key,actor,actor_label,TG_TABLE_NAME,record_key,TG_OP,delta);
 RETURN COALESCE(NEW,OLD);
END; $$ LANGUAGE plpgsql;
DO $$ DECLARE t TEXT; BEGIN
 FOREACH t IN ARRAY ARRAY['cases','case_clients','case_lawyers','case_opponents','case_updates','hearings','documents','payments','payment_receipts','case_reviews','tasks','consultation_requests','consultation_messages','powers_of_attorney'] LOOP
 EXECUTE format('CREATE TRIGGER case_activity_log AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION record_case_activity()',t);
 END LOOP;
END $$;
