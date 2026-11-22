CREATE TABLE user_profiles(user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 avatar_key TEXT,avatar_content_type TEXT,avatar_updated_at TIMESTAMPTZ);
CREATE TABLE account_messages(id BIGSERIAL PRIMARY KEY,user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 recipient TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',
 attempts INTEGER NOT NULL DEFAULT 0,next_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),sent_at TIMESTAMPTZ,last_error TEXT);
CREATE INDEX account_messages_pending ON account_messages(next_attempt) WHERE status IN('pending','sending');
CREATE FUNCTION cleanup_profile_avatar() RETURNS TRIGGER AS $$ BEGIN
 IF OLD.avatar_key IS NOT NULL THEN INSERT INTO attachment_cleanup(storage_key) VALUES(OLD.avatar_key) ON CONFLICT DO NOTHING; END IF;
 RETURN OLD;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER cleanup_profile_avatar AFTER DELETE ON user_profiles FOR EACH ROW EXECUTE FUNCTION cleanup_profile_avatar();
