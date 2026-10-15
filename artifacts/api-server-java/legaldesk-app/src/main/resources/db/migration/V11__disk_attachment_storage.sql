ALTER TABLE documents ADD COLUMN storage_key TEXT UNIQUE;
-- Existing bytes are migrated safely to disk by AttachmentStorage at startup.
