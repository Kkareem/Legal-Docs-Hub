package com.legaldesk.modules.auth.application;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.jdbc.core.JdbcTemplate;
import com.legaldesk.modules.notifications.application.NotificationSettingsService;

@Component
public class AccountMessageWorker {
 private final JdbcTemplate jdbc;private final NotificationSettingsService mail;
 public AccountMessageWorker(JdbcTemplate jdbc,NotificationSettingsService mail){this.jdbc=jdbc;this.mail=mail;}
 @Scheduled(fixedDelayString="${app.notifications.poll-ms:15000}") public void deliver(){
  jdbc.update("UPDATE account_messages SET status='pending' WHERE status='sending' AND next_attempt<NOW()-INTERVAL '10 minutes'");
  if(!mail.emailEnabled())return;
  for(int i=0;i<20;i++){
   var jobs=jdbc.queryForList("WITH candidate AS(SELECT id FROM account_messages WHERE status='pending' AND next_attempt<=NOW() ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE account_messages SET status='sending',attempts=attempts+1,next_attempt=NOW() WHERE id IN(SELECT id FROM candidate) RETURNING *");
   if(jobs.isEmpty())return;var job=jobs.getFirst();int attempts=((Number)job.get("attempts")).intValue();
   try{mail.sendMessage((String)job.get("recipient"),(String)job.get("title"),(String)job.get("body"));jdbc.update("UPDATE account_messages SET status='sent',sent_at=NOW(),last_error=NULL WHERE id=?",job.get("id"));}
   catch(Exception ex){jdbc.update("UPDATE account_messages SET status=?,last_error=?,next_attempt=NOW()+make_interval(mins=>?) WHERE id=?",attempts>=5?"failed":"pending",ex.getClass().getSimpleName(),Math.min(60,1<<Math.min(attempts,6)),job.get("id"));}
  }
 }
}
