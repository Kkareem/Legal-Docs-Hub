-- Enforce metadata-only storage for all new/updated records while old bytes await migration.
ALTER TABLE documents ADD CONSTRAINT documents_no_binary_content CHECK(content IS NULL) NOT VALID;
CREATE TABLE attachment_cleanup(storage_key TEXT PRIMARY KEY,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE FUNCTION schedule_attachment_cleanup() RETURNS TRIGGER AS $$ BEGIN
 IF OLD.storage_key IS NOT NULL THEN INSERT INTO attachment_cleanup(storage_key) VALUES(OLD.storage_key) ON CONFLICT DO NOTHING; END IF;
 RETURN OLD;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER schedule_attachment_cleanup AFTER DELETE ON documents FOR EACH ROW EXECUTE FUNCTION schedule_attachment_cleanup();
