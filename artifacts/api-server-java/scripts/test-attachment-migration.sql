BEGIN;
CREATE SCHEMA attachment_migration_test;
SET LOCAL search_path=attachment_migration_test;
CREATE TABLE payments(id BIGINT PRIMARY KEY);
CREATE TABLE documents(id BIGSERIAL PRIMARY KEY,client_id BIGINT,case_id BIGINT,uploaded_by BIGINT,file_name TEXT NOT NULL,file_url TEXT NOT NULL,doc_type TEXT DEFAULT 'other',created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE portal_files(id BIGINT PRIMARY KEY,client_id BIGINT,case_id BIGINT,payment_id BIGINT,uploaded_by BIGINT,file_name TEXT,content_type TEXT,file_size BIGINT,content BYTEA,created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE payment_receipts(id BIGINT PRIMARY KEY,file_id BIGINT REFERENCES portal_files(id));
INSERT INTO payments VALUES(1);
INSERT INTO documents(file_name,file_url) VALUES('original','https://example.com/original');
INSERT INTO portal_files(id,client_id,case_id,file_name,content_type,file_size,content) VALUES(1,1,1,'case.bin','application/octet-stream',3,decode('0001ff','hex'));
INSERT INTO portal_files(id,client_id,payment_id,file_name,content_type,file_size,content) VALUES(2,1,1,'receipt.bin','application/octet-stream',2,decode('abcd','hex'));
INSERT INTO payment_receipts VALUES(1,2);
ALTER TABLE documents ADD COLUMN payment_id BIGINT REFERENCES payments(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN content_type TEXT;
ALTER TABLE documents ADD COLUMN file_size BIGINT;
ALTER TABLE documents ADD COLUMN content BYTEA;
ALTER TABLE documents ADD COLUMN legacy_portal_file_id BIGINT UNIQUE;
-- Preserve document IDs and map old portal URLs independently to avoid ID collisions.
INSERT INTO documents(client_id,case_id,payment_id,uploaded_by,file_name,file_url,doc_type,content_type,file_size,content,created_at,legacy_portal_file_id)
SELECT client_id,case_id,payment_id,uploaded_by,file_name,'','other',content_type,file_size,content,created_at,id FROM portal_files;
UPDATE documents SET file_url='/api/office-portal/documents/' || id || '/content' WHERE content IS NOT NULL;
ALTER TABLE payment_receipts DROP CONSTRAINT payment_receipts_file_id_fkey;
UPDATE payment_receipts pr SET file_id=d.id FROM documents d WHERE d.legacy_portal_file_id=pr.file_id;
ALTER TABLE payment_receipts ADD CONSTRAINT payment_receipts_file_id_fkey FOREIGN KEY(file_id) REFERENCES documents(id) ON DELETE RESTRICT;
CREATE INDEX documents_payment_id_idx ON documents(payment_id);
DROP TABLE portal_files;

DO $$ BEGIN
 IF (SELECT count(*) FROM documents)<>3 OR (SELECT file_url FROM documents WHERE id=1)<>'https://example.com/original' THEN RAISE EXCEPTION 'Original metadata changed'; END IF;
 IF (SELECT encode(content,'hex') FROM documents WHERE legacy_portal_file_id=1)<>'0001ff' THEN RAISE EXCEPTION 'File bytes changed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM payment_receipts pr JOIN documents d ON d.id=pr.file_id WHERE d.legacy_portal_file_id=2 AND encode(d.content,'hex')='abcd') THEN RAISE EXCEPTION 'Receipt mapping lost'; END IF;
 IF to_regclass('portal_files') IS NOT NULL THEN RAISE EXCEPTION 'Old table still exists'; END IF;
END $$;
ROLLBACK;
