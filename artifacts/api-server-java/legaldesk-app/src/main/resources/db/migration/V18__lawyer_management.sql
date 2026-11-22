ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE cases ADD COLUMN title TEXT;
CREATE FUNCTION validate_case_lawyer() RETURNS TRIGGER AS $$ BEGIN
 PERFORM id FROM users WHERE id=NEW.user_id AND active AND deleted_at IS NULL AND role IN('lawyer','admin','owner') FOR KEY SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Cannot assign an inactive or deleted lawyer'; END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER validate_case_lawyer BEFORE INSERT OR UPDATE OF user_id ON case_lawyers FOR EACH ROW EXECUTE FUNCTION validate_case_lawyer();
