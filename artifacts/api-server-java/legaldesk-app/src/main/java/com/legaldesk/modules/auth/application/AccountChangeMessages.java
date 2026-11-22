package com.legaldesk.modules.auth.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountChangeMessages {
 private final JdbcTemplate jdbc;
 public AccountChangeMessages(JdbcTemplate jdbc){this.jdbc=jdbc;}
 @Transactional public void record(long userId,String title,String body,String... emails){
  long notice=jdbc.queryForObject("INSERT INTO notifications(user_id,type,title,body,ref_id,ref_type,site_visible) VALUES(?,'account',?,?,?,'account',COALESCE((SELECT site_enabled FROM notification_preferences WHERE user_id=?),TRUE)) RETURNING id",Long.class,userId,title,body,userId,userId);
  jdbc.update("INSERT INTO notification_delivery(notification_id,channel,subscription_id) SELECT ?,'browser',s.id FROM push_subscriptions s JOIN notification_preferences p ON p.user_id=s.user_id WHERE s.user_id=? AND p.browser_enabled",notice,userId);
  // Security messages are addressed to snapshots of the old/new contact, independently of marketing/notification preferences.
  var recipients=new LinkedHashSet<String>();for(String email:emails)if(email!=null&&!email.isBlank())recipients.add(email.toLowerCase(Locale.ROOT));
  for(String email:recipients)jdbc.update("INSERT INTO account_messages(user_id,recipient,title,body) VALUES(?,?,?,?)",userId,email,title,body+"\nإذا لم تقم بهذا التغيير، تواصل مع إدارة المكتب فورًا.");
 }

 @Transactional public void recordCase(long userId,long caseId,boolean removed,String title,String body,String email){
  long notice=jdbc.queryForObject("INSERT INTO notifications(user_id,type,title,body,ref_id,ref_type,site_visible) VALUES(?,'case',?,?,?,?,COALESCE((SELECT site_enabled FROM notification_preferences WHERE user_id=?),TRUE)) RETURNING id",Long.class,userId,title,body,caseId,removed?"case_assignment_removed":"case",userId);
  jdbc.update("INSERT INTO notification_delivery(notification_id,channel,subscription_id) SELECT ?,'browser',s.id FROM push_subscriptions s JOIN notification_preferences p ON p.user_id=s.user_id WHERE s.user_id=? AND p.browser_enabled",notice,userId);
  boolean enabled=jdbc.queryForObject("SELECT COALESCE((SELECT email_enabled FROM notification_preferences WHERE user_id=?),TRUE)",Boolean.class,userId);
  if(enabled&&email!=null&&!email.isBlank())jdbc.update("INSERT INTO account_messages(user_id,recipient,title,body) VALUES(?,?,?,?)",userId,email,title,body);
 }
}
