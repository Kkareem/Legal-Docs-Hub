package com.legaldesk.modules.notifications.application;

import com.legaldesk.common.domain.BusinessRuleViolationException;
import com.legaldesk.shared.security.CurrentUserFacade;
import java.nio.file.*;
import java.net.URI;
import java.security.*;
import java.util.*;
import javax.crypto.Cipher;
import javax.crypto.spec.*;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.interfaces.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.SimpleMailMessage;

@Service
public class NotificationSettingsService {
 private final JdbcTemplate jdbc;
 private final CurrentUserFacade current;
 private final com.legaldesk.modules.settings.application.SettingsService settings;
 private final com.legaldesk.modules.settings.application.SettingsCipher cipher;
 private final String vapidSubject;
 public NotificationSettingsService(JdbcTemplate jdbc,CurrentUserFacade current,com.legaldesk.modules.settings.application.SettingsService settings,com.legaldesk.modules.settings.application.SettingsCipher cipher,@Value("${app.vapid-subject:mailto:admin@example.com}")String vapidSubject){this.jdbc=jdbc;this.current=current;this.settings=settings;this.cipher=cipher;this.vapidSubject=vapidSubject;Security.addProvider(new BouncyCastleProvider());}
 @Transactional
 public Map<String,Object> preferences(){
  long user=current.currentUserId();
  jdbc.update("INSERT INTO notification_preferences(user_id) VALUES(?) ON CONFLICT DO NOTHING",user);
  return jdbc.queryForMap("SELECT site_enabled,email_enabled,browser_enabled FROM notification_preferences WHERE user_id=?",user);
 }
 @Transactional
 public Map<String,Object> savePreferences(boolean site,boolean email,boolean browser){
  long user=current.currentUserId();
  jdbc.update("INSERT INTO notification_preferences(user_id,site_enabled,email_enabled,browser_enabled) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET site_enabled=EXCLUDED.site_enabled,email_enabled=EXCLUDED.email_enabled,browser_enabled=EXCLUDED.browser_enabled",user,site,email,browser);
  // Turning off a channel cancels its pending work, so re-enabling never replays old alerts.
  if(!email)jdbc.update("UPDATE notification_delivery SET status='skipped' WHERE notification_id IN(SELECT id FROM notifications WHERE user_id=?) AND channel='email' AND status='pending'",user);
  if(!browser){jdbc.update("DELETE FROM push_subscriptions WHERE user_id=?",user);}
  return preferences();
 }
 public Map<String,Object> config(){
  return Map.of("currency",settings.currency(),"emailReady",emailEnabled(),"pushPublicKey",vapidKeys().get("public_key"),"publicUrl",settings.publicUrl());
 }
 public String publicUrl(){return settings.publicUrl();}
 public String vapidSubject(){return vapidSubject;}
 public boolean emailEnabled(){return Boolean.TRUE.equals(settings.get("office.email").get("enabled"));}
 public Map<String,Object> emailSettings(){
  var row=settings.get("office.email");var safe=new LinkedHashMap<String,Object>();safe.put("enabled",row.getOrDefault("enabled",false));safe.put("email",row.getOrDefault("username",""));safe.put("password_configured",!Objects.toString(row.get("password_encrypted"),"").isBlank());safe.put("delivery",jdbc.queryForList("SELECT status,COUNT(*) AS count FROM (SELECT status FROM notification_delivery WHERE channel='email' UNION ALL SELECT status FROM account_messages) deliveries GROUP BY status"));return safe;
 }
 @Transactional
 public void saveEmail(boolean enabled,String host,int port,String username,String password,String from,String tls){
  var row=settings.lock("office.email");
  String encrypted=(String)row.get("password_encrypted");
  if(password!=null&&!password.isBlank()){
   if(password.length()!=16)throw new BusinessRuleViolationException("Use a 16-character Google application password");
   encrypted=encrypt(password);
  }
  if(enabled&&(host.isBlank()||username.isBlank()||encrypted.isBlank()||from.isBlank()))throw new BusinessRuleViolationException("SMTP host, username, sender and application password are required");
  settings.put("office.email",Map.of("enabled",enabled,"host",host.trim(),"port",port,"username",username.trim(),"password_encrypted",encrypted,"from_address",from.trim(),"tls_mode",tls));
 }
 public void sendEmail(String to,String title){sendMessage(to,title,"يوجد تحديث جديد في حسابك بالمكتب. سجّل الدخول للاطلاع على التفاصيل:\n"+publicUrl()+"/notifications");}
 public void sendMessage(String to,String title,String body){
  var row=settings.get("office.email");
  if(!Boolean.TRUE.equals(row.get("enabled")))throw new IllegalStateException("Email is disabled");
  var sender=new JavaMailSenderImpl();sender.setHost((String)row.get("host"));sender.setPort(((Number)row.get("port")).intValue());
  sender.setUsername((String)row.get("username"));sender.setPassword(decrypt((String)row.get("password_encrypted")));
  var props=sender.getJavaMailProperties();props.setProperty("mail.smtp.auth","true");
  props.setProperty("mail.smtp.connectiontimeout","10000");props.setProperty("mail.smtp.timeout","10000");props.setProperty("mail.smtp.writetimeout","10000");
  props.setProperty("mail.smtp.ssl.checkserveridentity","true");
  if("ssl".equals(row.get("tls_mode")))props.setProperty("mail.smtp.ssl.enable","true");
  else{props.setProperty("mail.smtp.starttls.enable","true");props.setProperty("mail.smtp.starttls.required","true");}
  var mail=new SimpleMailMessage();mail.setFrom((String)row.get("from_address"));mail.setTo(to);mail.setSubject(title);
  mail.setText(body);sender.send(mail);
 }
 @Transactional
 public Map<String,Object> vapidKeys(){
  settings.lock("office.email");
  var keys=settings.get("notifications.vapid");if(!keys.isEmpty())return keys;
  try{
   var generator=KeyPairGenerator.getInstance("EC","BC");generator.initialize(new java.security.spec.ECGenParameterSpec("secp256r1"));var pair=generator.generateKeyPair();
   var encoder=Base64.getUrlEncoder().withoutPadding();
   String pub=encoder.encodeToString(((ECPublicKey)pair.getPublic()).getQ().getEncoded(false));
   byte[] raw=((ECPrivateKey)pair.getPrivate()).getD().toByteArray();byte[] fixed=new byte[32];
   System.arraycopy(raw,Math.max(0,raw.length-32),fixed,Math.max(0,32-raw.length),Math.min(32,raw.length));
   String secret=encrypt(encoder.encodeToString(fixed));
   settings.put("notifications.vapid",Map.of("public_key",pub,"private_key",secret));
   return settings.get("notifications.vapid");
  }catch(GeneralSecurityException ex){throw new IllegalStateException("Cannot initialize browser notifications",ex);}
 }
 public String decrypt(String encrypted){return cipher.decrypt(encrypted);}
 private String encrypt(String plain){return cipher.encrypt(plain);}
 public static boolean validEndpoint(String endpoint){
  try{URI uri=URI.create(endpoint);String host=uri.getHost();
   return "https".equals(uri.getScheme())&&uri.getUserInfo()==null&&(uri.getPort()==-1||uri.getPort()==443)&&host!=null&&uri.getFragment()==null&&
    (host.equals("fcm.googleapis.com")||host.equals("updates.push.services.mozilla.com")||host.equals("web.push.apple.com")||host.endsWith(".notify.windows.com"));
  }catch(IllegalArgumentException ex){return false;}
 }
 @Transactional
 public void subscribe(String endpoint,String p256dh,String auth){
  if(!validEndpoint(endpoint))throw new BusinessRuleViolationException("Unsupported push service endpoint");
  try{new nl.martijndwars.webpush.Notification(endpoint,p256dh,auth,"test");if(Base64.getUrlDecoder().decode(auth).length!=16)throw new IllegalArgumentException();}
  catch(Exception ex){throw new BusinessRuleViolationException("Invalid browser subscription keys");}
  long user=current.currentUserId();
  if(jdbc.queryForObject("SELECT COUNT(*) FROM push_subscriptions WHERE user_id=?",Long.class,user)>=10 && jdbc.queryForObject("SELECT COUNT(*) FROM push_subscriptions WHERE endpoint=? AND user_id=?",Long.class,endpoint,user)==0)throw new BusinessRuleViolationException("At most 10 browsers can subscribe");
  jdbc.update("INSERT INTO push_subscriptions(user_id,endpoint,p256dh,auth) VALUES(?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=EXCLUDED.user_id,p256dh=EXCLUDED.p256dh,auth=EXCLUDED.auth",user,endpoint,p256dh,auth);
 }
 public void unsubscribe(String endpoint){jdbc.update("DELETE FROM push_subscriptions WHERE endpoint=? AND user_id=?",endpoint,current.currentUserId());}
}
