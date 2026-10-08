-- Record metadata edits and transfers in both affected case histories. Binary file content is excluded.
CREATE OR REPLACE FUNCTION record_case_activity() RETURNS TRIGGER AS $$
DECLARE previous JSONB; following JSONB; row_data JSONB; delta JSONB; field TEXT; case_key BIGINT; actor BIGINT; actor_label TEXT; record_key BIGINT; previous_case BIGINT;
BEGIN
 IF TG_TABLE_NAME='documents' THEN
  IF TG_OP<>'INSERT' THEN previous=jsonb_build_object('id',OLD.id,'case_id',OLD.case_id,'client_id',OLD.client_id,'file_name',OLD.file_name,'file_size',OLD.file_size,'doc_type',OLD.doc_type,'notes',OLD.notes,'uploaded_by',OLD.uploaded_by,'file_url',OLD.file_url,'is_original',OLD.is_original,'content_type',OLD.content_type,'payment_id',OLD.payment_id); END IF;
  IF TG_OP<>'DELETE' THEN following=jsonb_build_object('id',NEW.id,'case_id',NEW.case_id,'client_id',NEW.client_id,'file_name',NEW.file_name,'file_size',NEW.file_size,'doc_type',NEW.doc_type,'notes',NEW.notes,'uploaded_by',NEW.uploaded_by,'file_url',NEW.file_url,'is_original',NEW.is_original,'content_type',NEW.content_type,'payment_id',NEW.payment_id); END IF;
 ELSE
  IF TG_OP<>'INSERT' THEN previous=to_jsonb(OLD)-ARRAY['created_at','updated_at','tracking_token']; END IF;
  IF TG_OP<>'DELETE' THEN following=to_jsonb(NEW)-ARRAY['created_at','updated_at','tracking_token']; END IF;
 END IF;
 row_data=COALESCE(following,previous);record_key=(row_data->>'id')::BIGINT;
 IF TG_TABLE_NAME='cases' THEN case_key=record_key;
 ELSIF TG_TABLE_NAME='payment_receipts' THEN SELECT case_id INTO case_key FROM payments WHERE id=(row_data->>'payment_id')::BIGINT;
 ELSIF TG_TABLE_NAME='consultation_messages' THEN SELECT case_id INTO case_key FROM consultation_requests WHERE id=(row_data->>'request_id')::BIGINT;
 ELSE previous_case=(previous->>'case_id')::BIGINT; case_key=COALESCE((row_data->>'case_id')::BIGINT,previous_case); END IF;
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
 IF previous_case IS NOT NULL AND previous_case<>case_key THEN
 INSERT INTO case_activity(case_id,actor_id,actor_name,entity,entity_id,action,changes) VALUES(previous_case,actor,actor_label,TG_TABLE_NAME,record_key,TG_OP,delta);
 END IF;
 RETURN COALESCE(NEW,OLD);
END; $$ LANGUAGE plpgsql;
