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
