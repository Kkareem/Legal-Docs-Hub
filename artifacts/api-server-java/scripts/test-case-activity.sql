\set ON_ERROR_STOP on
BEGIN;
DO $$ DECLARE client_key BIGINT; first_case BIGINT; second_case BIGINT; file_key BIGINT; actor_key BIGINT; old_count BIGINT; BEGIN
 SELECT id INTO actor_key FROM users WHERE active AND role IN ('admin','owner') ORDER BY id LIMIT 1;
 PERFORM set_config('app.actor_id',actor_key::TEXT,true);
 INSERT INTO clients(name,status) VALUES('Activity transaction test','active') RETURNING id INTO client_key;
 INSERT INTO cases(case_number,type,client_id,status) VALUES('ACTIVITY-TEST-A','civil',client_key,'active') RETURNING id INTO first_case;
 INSERT INTO cases(case_number,type,client_id,status) VALUES('ACTIVITY-TEST-B','civil',client_key,'active') RETURNING id INTO second_case;
 INSERT INTO documents(case_id,client_id,file_name,file_url,content,file_size) VALUES(first_case,client_key,'test.bin','',decode('00ff','hex'),2) RETURNING id INTO file_key;
 UPDATE documents SET case_id=second_case,is_original=true WHERE id=file_key;
 IF (SELECT COUNT(*) FROM case_activity WHERE entity='documents' AND entity_id=file_key AND action='UPDATE')<>2 THEN RAISE EXCEPTION 'Transfer must be recorded in both case histories'; END IF;
 UPDATE documents SET case_id=NULL WHERE id=file_key;
 IF (SELECT COUNT(*) FROM case_activity WHERE case_id=second_case AND entity='documents' AND entity_id=file_key AND action='UPDATE')<>2 THEN RAISE EXCEPTION 'Unlink must be recorded in old case history'; END IF;
 IF EXISTS(SELECT 1 FROM case_activity WHERE case_id IN(first_case,second_case) AND (actor_id IS DISTINCT FROM actor_key OR changes ? 'content')) THEN RAISE EXCEPTION 'Actor identity and binary exclusions'; END IF;
 SELECT COUNT(*) INTO old_count FROM case_activity WHERE case_id=first_case;
 UPDATE cases SET status=status WHERE id=first_case;
 IF (SELECT COUNT(*) FROM case_activity WHERE case_id=first_case)<>old_count THEN RAISE EXCEPTION 'No-op should not create an activity'; END IF;
 DELETE FROM cases WHERE id=first_case;
 IF NOT EXISTS(SELECT 1 FROM case_activity WHERE case_id=first_case AND entity='cases' AND action='DELETE') THEN RAISE EXCEPTION 'Deletion must retain audit history'; END IF;
END $$;
ROLLBACK;
DO $$ BEGIN IF NULLIF(current_setting('app.actor_id',true),'') IS NOT NULL THEN RAISE EXCEPTION 'Transaction actor leaked'; END IF; END $$;
SELECT 'PASS: transfer/unlink histories, document metadata, actor identity, binary exclusion, no-op, delete retention, transaction reset' AS result;
