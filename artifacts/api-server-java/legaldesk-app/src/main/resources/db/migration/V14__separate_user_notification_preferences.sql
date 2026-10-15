-- Personal preferences belong to users, separate from office-wide settings.
CREATE TABLE notification_preferences(
 user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 site_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 browser_enabled BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO notification_preferences(user_id,site_enabled,email_enabled,browser_enabled)
SELECT u.id,COALESCE((s.value->>'site_enabled')::boolean,TRUE),
 COALESCE((s.value->>'email_enabled')::boolean,TRUE),COALESCE((s.value->>'browser_enabled')::boolean,FALSE)
FROM users u JOIN settings s ON s.name='notifications.user.'||u.id;
DROP TRIGGER user_settings_cleanup ON users;
DROP FUNCTION remove_user_settings();
DELETE FROM settings WHERE name LIKE 'notifications.user.%';
ALTER TABLE settings ADD CONSTRAINT settings_no_user_notifications CHECK(name NOT LIKE 'notifications.user.%');

CREATE OR REPLACE FUNCTION send_user_notification(recipient BIGINT,kind TEXT,heading TEXT,message TEXT,reference_id BIGINT,reference_type TEXT) RETURNS VOID AS $$
DECLARE n BIGINT; p RECORD;
BEGIN
 IF recipient IS NULL OR NOT EXISTS(SELECT 1 FROM users WHERE id=recipient AND active) THEN RETURN; END IF;
 INSERT INTO notification_preferences(user_id) VALUES(recipient) ON CONFLICT DO NOTHING;
 SELECT * INTO p FROM notification_preferences WHERE user_id=recipient;
 IF NOT(p.site_enabled OR p.email_enabled OR p.browser_enabled) THEN RETURN; END IF;
 INSERT INTO notifications(user_id,type,title,body,ref_id,ref_type,site_visible) VALUES(recipient,kind,heading,message,reference_id,reference_type,p.site_enabled) RETURNING id INTO n;
 IF p.email_enabled AND EXISTS(SELECT 1 FROM users WHERE id=recipient AND email IS NOT NULL) AND EXISTS(SELECT 1 FROM settings WHERE name='office.email' AND (value->>'enabled')::boolean) THEN INSERT INTO notification_delivery(notification_id,channel) VALUES(n,'email'); END IF;
 IF p.browser_enabled THEN INSERT INTO notification_delivery(notification_id,channel,subscription_id) SELECT n,'browser',id FROM push_subscriptions WHERE user_id=recipient; END IF;
END; $$ LANGUAGE plpgsql;
