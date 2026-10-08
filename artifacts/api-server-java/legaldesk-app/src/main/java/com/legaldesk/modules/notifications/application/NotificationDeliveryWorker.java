package com.legaldesk.modules.notifications.application;
import java.util.*;
import java.time.Duration;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.*;
import nl.martijndwars.webpush.*;

@Component
@EnableScheduling
public class NotificationDeliveryWorker {
 private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NEVER).build();
 private final JdbcTemplate jdbc;
 private final NotificationSettingsService settings;
 public NotificationDeliveryWorker(JdbcTemplate jdbc,NotificationSettingsService settings){this.jdbc=jdbc;this.settings=settings;}
 @Scheduled(fixedDelayString="${app.notifications.poll-ms:15000}")
 public void deliver(){
  jdbc.update("UPDATE notification_delivery SET status='pending' WHERE status='sending' AND next_attempt<NOW()-INTERVAL '10 minutes'");
  jdbc.update("UPDATE notification_delivery SET status='skipped',last_error='expired' WHERE status='pending' AND notification_id IN(SELECT id FROM notifications WHERE created_at<NOW()-INTERVAL '7 days')");
  boolean mail=settings.emailEnabled();
  for(int i=0;i<20;i++){
   var jobs=jdbc.queryForList("WITH candidate AS (SELECT id FROM notification_delivery WHERE status='pending' AND next_attempt<=NOW() AND (channel='browser' OR ?) ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE notification_delivery SET status='sending',next_attempt=NOW(),attempts=attempts+1 WHERE id IN(SELECT id FROM candidate) RETURNING *",mail);
   if(jobs.isEmpty())return;
   var job=jobs.getFirst();long id=((Number)job.get("id")).longValue();int attempts=((Number)job.get("attempts")).intValue();
   try{
    var recipients=jdbc.queryForList("SELECT n.title,u.id AS user_id,u.email,u.active,u.must_change_password,COALESCE(p.email_enabled,TRUE) AS email_enabled,COALESCE(p.browser_enabled,FALSE) AS browser_enabled FROM notifications n JOIN users u ON u.id=n.user_id LEFT JOIN notification_preferences p ON p.user_id=u.id WHERE n.id=?",job.get("notification_id"));
    if(recipients.isEmpty()){finish(id,"skipped");continue;}
    var user=recipients.getFirst();boolean email="email".equals(job.get("channel"));
    if(!Boolean.TRUE.equals(user.get("active"))||!Boolean.TRUE.equals(user.get(email?"email_enabled":"browser_enabled"))){finish(id,"skipped");continue;}
    if(Boolean.TRUE.equals(user.get("must_change_password"))){jdbc.update("UPDATE notification_delivery SET status='pending',attempts=attempts-1,next_attempt=NOW()+INTERVAL '1 hour' WHERE id=?",id);continue;}
    if(email){
     if(!settings.emailEnabled()){finish(id,"skipped");continue;}
     settings.sendEmail((String)user.get("email"),(String)user.get("title"));
    }else{
     var subscriptions=jdbc.queryForList("SELECT * FROM push_subscriptions WHERE id=? AND user_id=?",job.get("subscription_id"),user.get("user_id"));
     if(subscriptions.isEmpty()){finish(id,"skipped");continue;}
     var sub=subscriptions.getFirst();String endpoint=(String)sub.get("endpoint");
     if(!NotificationSettingsService.validEndpoint(endpoint)){finish(id,"skipped");continue;}
     var keys=settings.vapidKeys();var push=new PushService((String)keys.get("public_key"),settings.decrypt((String)keys.get("private_key")),settings.vapidSubject());
     var notification=new Notification(endpoint,(String)sub.get("p256dh"),(String)sub.get("auth"),"{\"title\":\"LegalDesk\",\"body\":\"يوجد تحديث جديد في حسابك بالمكتب\",\"url\":\"/notifications\"}");
     var post=push.preparePost(notification,Encoding.AES128GCM);
     var builder=java.net.http.HttpRequest.newBuilder(post.getURI()).timeout(Duration.ofSeconds(15))
      .POST(java.net.http.HttpRequest.BodyPublishers.ofByteArray(post.getEntity().getContent().readAllBytes()));
     for(var header:post.getAllHeaders())builder.header(header.getName(),header.getValue());
     int status=client.send(builder.build(),HttpResponse.BodyHandlers.discarding()).statusCode();
     if(status==404||status==410){jdbc.update("DELETE FROM push_subscriptions WHERE id=?",sub.get("id"));continue;}
     if(status<200||status>=300)throw new IllegalStateException("Push delivery returned "+status);
    }
    finish(id,"sent");
   }catch(Exception ex){
    jdbc.update("UPDATE notification_delivery SET status=?,last_error=?,next_attempt=NOW()+(? * INTERVAL '1 minute') WHERE id=?",attempts>=5?"failed":"pending",ex.getClass().getSimpleName(),Math.min(60,1<<attempts),id);
   }
  }
 }
 private void finish(long id,String status){jdbc.update("UPDATE notification_delivery SET status=?,sent_at=CASE WHEN ?='sent' THEN NOW() ELSE NULL END,last_error=NULL WHERE id=?",status,status,id);}
}
