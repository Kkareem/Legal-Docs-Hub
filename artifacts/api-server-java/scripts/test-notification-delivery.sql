-- All fixtures and Gmail enablement are rolled back. No real messages leave the server.
BEGIN;
DO $$ DECLARE recipient BIGINT; n BIGINT; count_jobs BIGINT; BEGIN
 INSERT INTO users(name,email,password_hash,role) VALUES('Notification SQL fixture','notifications-transaction@example.com','unused','client') RETURNING id INTO recipient;
 INSERT INTO notification_preferences(user_id,site_enabled,email_enabled,browser_enabled) VALUES(recipient,FALSE,TRUE,FALSE);
 UPDATE office_email_settings SET enabled=TRUE WHERE id=1;
 PERFORM send_user_notification(recipient,'general','test','test',NULL,NULL);
 SELECT id INTO n FROM notifications WHERE user_id=recipient;
 IF n IS NULL OR (SELECT site_visible FROM notifications WHERE id=n) THEN RAISE EXCEPTION 'Email-only notification exposed on site'; END IF;
 SELECT COUNT(*) INTO count_jobs FROM notification_delivery WHERE notification_id=n AND channel='email';
 IF count_jobs<>1 THEN RAISE EXCEPTION 'Email delivery not queued'; END IF;
 UPDATE notification_preferences SET email_enabled=FALSE,browser_enabled=TRUE WHERE user_id=recipient;
 INSERT INTO push_subscriptions(user_id,endpoint,p256dh,auth) VALUES(recipient,'https://fcm.googleapis.com/transaction-only','unused','unused');
 PERFORM send_user_notification(recipient,'general','browser-test','test',NULL,NULL);
 IF (SELECT COUNT(*) FROM notification_delivery d JOIN notifications n ON n.id=d.notification_id WHERE n.user_id=recipient AND d.channel='browser')<>1 THEN RAISE EXCEPTION 'Push delivery not queued'; END IF;
 UPDATE notification_preferences SET browser_enabled=FALSE WHERE user_id=recipient;
 PERFORM send_user_notification(recipient,'general','muted','test',NULL,NULL);
 IF (SELECT COUNT(*) FROM notifications WHERE user_id=recipient)<>2 THEN RAISE EXCEPTION 'Muted user was notified'; END IF;
 DELETE FROM users WHERE id=recipient;
 IF EXISTS(SELECT 1 FROM notifications WHERE user_id=recipient) THEN RAISE EXCEPTION 'User notifications not removed'; END IF;
END $$;
ROLLBACK;
