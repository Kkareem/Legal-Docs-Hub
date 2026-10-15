ALTER TABLE hearings ADD COLUMN hearing_number INTEGER;
WITH numbered AS (SELECT id,row_number() OVER(PARTITION BY case_id ORDER BY datetime,id) AS n FROM hearings)
UPDATE hearings h SET hearing_number=n.n FROM numbered n WHERE n.id=h.id;
ALTER TABLE hearings ALTER COLUMN hearing_number SET NOT NULL;
ALTER TABLE hearings ADD CONSTRAINT hearing_number_unique UNIQUE(case_id,hearing_number);
CREATE FUNCTION assign_hearing_number() RETURNS TRIGGER AS $$ BEGIN
 PERFORM id FROM cases WHERE id=NEW.case_id FOR UPDATE;
 IF TG_OP='INSERT' OR NEW.case_id IS DISTINCT FROM OLD.case_id THEN
 SELECT COALESCE(MAX(hearing_number),0)+1 INTO NEW.hearing_number FROM hearings WHERE case_id=NEW.case_id;
 ELSE NEW.hearing_number=OLD.hearing_number; END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER hearing_number BEFORE INSERT OR UPDATE ON hearings FOR EACH ROW EXECUTE FUNCTION assign_hearing_number();
CREATE TABLE hearing_reports(id BIGSERIAL PRIMARY KEY,case_id BIGINT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
 hearing_id BIGINT NOT NULL REFERENCES hearings(id) ON DELETE CASCADE,body TEXT NOT NULL,
 created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE case_client_requests(id BIGSERIAL PRIMARY KEY,case_id BIGINT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
 hearing_id BIGINT NOT NULL REFERENCES hearings(id) ON DELETE CASCADE,report_id BIGINT NOT NULL REFERENCES hearing_reports(id) ON DELETE CASCADE,
 client_id BIGINT NOT NULL REFERENCES clients(id),title TEXT NOT NULL,details TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN('document','other')),target_hearing_id BIGINT REFERENCES hearings(id),due_at TIMESTAMPTZ,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','completed')),completion_notes TEXT,
 completed_by BIGINT REFERENCES users(id),completed_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX client_requests_case ON case_client_requests(case_id,id);
ALTER TABLE documents ADD COLUMN client_request_id BIGINT REFERENCES case_client_requests(id) ON DELETE SET NULL;
CREATE TRIGGER case_activity_log AFTER INSERT OR UPDATE OR DELETE ON hearing_reports FOR EACH ROW EXECUTE FUNCTION record_case_activity();
CREATE TRIGGER case_activity_log AFTER INSERT OR UPDATE OR DELETE ON case_client_requests FOR EACH ROW EXECUTE FUNCTION record_case_activity();
ALTER TABLE case_activity ADD COLUMN context JSONB NOT NULL DEFAULT '{}'::JSONB;
CREATE FUNCTION enrich_case_activity() RETURNS TRIGGER AS $$
DECLARE data JSONB; snapshot JSONB; hearing_key BIGINT; BEGIN
 -- JSON null needs an explicit fallback for deleted values.
 SELECT COALESCE(jsonb_object_agg(k,CASE WHEN v->'after'='null'::JSONB THEN v->'before' ELSE v->'after' END),'{}') INTO data FROM jsonb_each(NEW.changes) e(k,v);
 IF NEW.entity IN('hearings','hearing_reports','case_client_requests','case_opponents','payments','payment_receipts','case_updates') AND NEW.action<>'DELETE' THEN
 EXECUTE format('SELECT to_jsonb(t)-ARRAY[''created_at'',''updated_at''] FROM %I t WHERE id=$1',NEW.entity) INTO snapshot USING NEW.entity_id;
 data=COALESCE(snapshot,'{}')||data;
 END IF;
 IF NEW.entity='hearings' THEN hearing_key=NEW.entity_id;
 ELSIF NEW.entity IN('hearing_reports','case_client_requests') THEN hearing_key=(data->>'hearing_id')::BIGINT; END IF;
 IF hearing_key IS NOT NULL THEN SELECT to_jsonb(h)-ARRAY['notes'] INTO NEW.context FROM hearings h WHERE h.id=hearing_key; END IF;
 NEW.context=COALESCE(NEW.context,'{}')||data;
 IF NEW.entity='case_client_requests' THEN NEW.context=NEW.context||jsonb_build_object('attached_files',(SELECT string_agg(file_name,'، ' ORDER BY id) FROM documents WHERE client_request_id=NEW.entity_id)); END IF;
 IF NEW.entity='documents' THEN NEW.context=NEW.context||jsonb_build_object('request_title',(SELECT r.title FROM documents d JOIN case_client_requests r ON r.id=d.client_request_id WHERE d.id=NEW.entity_id)); END IF;
 IF data ? 'client_id' THEN NEW.context=NEW.context||jsonb_build_object('client_name',(SELECT name FROM clients WHERE id=(data->>'client_id')::BIGINT)); END IF;
 IF data ? 'target_hearing_id' THEN NEW.context=NEW.context||jsonb_build_object('target_hearing_number',(SELECT hearing_number FROM hearings WHERE id=(data->>'target_hearing_id')::BIGINT)); END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER activity_context BEFORE INSERT ON case_activity FOR EACH ROW EXECUTE FUNCTION enrich_case_activity();
CREATE FUNCTION notify_client_request() RETURNS TRIGGER AS $$ BEGIN
 IF TG_OP='INSERT' THEN
 PERFORM send_user_notification((SELECT user_id FROM clients WHERE id=NEW.client_id),'case','طلب من الموكل',NEW.title,NEW.case_id,'case');
 ELSIF NEW.status='completed' AND OLD.status<>'completed' THEN
 PERFORM notify_case_people(NEW.case_id,'case','تم تلبية طلب الموكل',NEW.title);
 END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER notification_request AFTER INSERT OR UPDATE ON case_client_requests FOR EACH ROW EXECUTE FUNCTION notify_client_request();
