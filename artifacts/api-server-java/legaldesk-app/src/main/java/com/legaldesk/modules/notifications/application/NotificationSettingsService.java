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
 private final byte[] key;
 private final String currency;
 private final String publicUrl;
 private final String vapidSubject;
 public NotificationSettingsService(JdbcTemplate jdbc,CurrentUserFacade current,
  @Value("${app.currency:SAR}")String currency,@Value("${app.public-url:http://localhost:4020}")String publicUrl,
  @Value("${app.settings-key-file:.data/settings.key}")String keyFile,
  @Value("${app.vapid-subject:mailto:admin@example.com}")String vapidSubject)throws Exception{
  this.jdbc=jdbc;this.current=current;
  this.currency=Currency.getInstance(currency.toUpperCase(Locale.ROOT)).getCurrencyCode();
  this.publicUrl=publicUrl.replaceAll("/+$","");this.vapidSubject=vapidSubject;
  URI uri=URI.create(this.publicUrl);
  if(!Set.of("http","https").contains(uri.getScheme())||uri.getHost()==null)throw new IllegalArgumentException("APP_PUBLIC_URL must be an absolute HTTP(S) URL");
  Path path=Path.of(keyFile).toAbsolutePath();Files.createDirectories(path.getParent());
  byte[] generated=new byte[32];new SecureRandom().nextBytes(generated);
  try{Files.writeString(path,Base64.getEncoder().encodeToString(generated),StandardOpenOption.CREATE_NEW);}catch(FileAlreadyExistsException ignored){}
  this.key=Base64.getDecoder().decode(Files.readString(path).trim());
  if(key.length!=32)throw new IllegalArgumentException("Settings encryption key must contain 32 bytes");
  Security.addProvider(new BouncyCastleProvider());
 }
 @Transactional
 public Map<String,Object> preferences(){
  jdbc.update("INSERT INTO notification_preferences(user_id) VALUES(?) ON CONFLICT DO NOTHING",current.currentUserId());
  return jdbc.queryForMap("SELECT site_enabled,email_enabled,browser_enabled FROM notification_preferences WHERE user_id=?",current.currentUserId());
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
  return Map.of("currency",currency,"emailReady",emailEnabled(),"pushPublicKey",vapidKeys().get("public_key"),"publicUrl",publicUrl);
 }
 public String publicUrl(){return publicUrl;}
 public String vapidSubject(){return vapidSubject;}
 public boolean emailEnabled(){return Boolean.TRUE.equals(jdbc.queryForObject("SELECT enabled FROM office_email_settings WHERE id=1",Boolean.class));}
 public Map<String,Object> emailSettings(){
  var row=jdbc.queryForMap("SELECT enabled,username AS email,password_encrypted<>'' AS password_configured FROM office_email_settings WHERE id=1");
  row.put("delivery",jdbc.queryForList("SELECT status,COUNT(*) AS count FROM notification_delivery WHERE channel='email' GROUP BY status"));
  return row;
 }
 @Transactional
 public void saveEmail(boolean enabled,String host,int port,String username,String password,String from,String tls){
  var row=jdbc.queryForMap("SELECT password_encrypted FROM office_email_settings WHERE id=1 FOR UPDATE");
  String encrypted=(String)row.get("password_encrypted");
  if(password!=null&&!password.isBlank()){
   if(password.length()!=16)throw new BusinessRuleViolationException("Use a 16-character Google application password");
   encrypted=encrypt(password);
  }
  if(enabled&&(host.isBlank()||username.isBlank()||encrypted.isBlank()||from.isBlank()))throw new BusinessRuleViolationException("SMTP host, username, sender and application password are required");
  jdbc.update("UPDATE office_email_settings SET enabled=?,host=?,port=?,username=?,password_encrypted=?,from_address=?,tls_mode=? WHERE id=1",enabled,host.trim(),port,username.trim(),encrypted,from.trim(),tls);
 }
 public void sendEmail(String to,String title){
  var row=jdbc.queryForMap("SELECT * FROM office_email_settings WHERE id=1");
  if(!Boolean.TRUE.equals(row.get("enabled")))throw new IllegalStateException("Email is disabled");
  var sender=new JavaMailSenderImpl();sender.setHost((String)row.get("host"));sender.setPort(((Number)row.get("port")).intValue());
  sender.setUsername((String)row.get("username"));sender.setPassword(decrypt((String)row.get("password_encrypted")));
  var props=sender.getJavaMailProperties();props.setProperty("mail.smtp.auth","true");
  props.setProperty("mail.smtp.connectiontimeout","10000");props.setProperty("mail.smtp.timeout","10000");props.setProperty("mail.smtp.writetimeout","10000");
  props.setProperty("mail.smtp.ssl.checkserveridentity","true");
  if("ssl".equals(row.get("tls_mode")))props.setProperty("mail.smtp.ssl.enable","true");
  else{props.setProperty("mail.smtp.starttls.enable","true");props.setProperty("mail.smtp.starttls.required","true");}
  var mail=new SimpleMailMessage();mail.setFrom((String)row.get("from_address"));mail.setTo(to);mail.setSubject(title);
  mail.setText("يوجد تحديث جديد في حسابك بالمكتب. سجّل الدخول للاطلاع على التفاصيل:\n"+publicUrl+"/notifications");sender.send(mail);
 }
 @Transactional
 public Map<String,Object> vapidKeys(){
  jdbc.queryForObject("SELECT id FROM office_email_settings WHERE id=1 FOR UPDATE",Integer.class);
  var rows=jdbc.queryForList("SELECT public_key,private_key FROM notification_vapid WHERE id=1");
  if(!rows.isEmpty())return rows.getFirst();
  try{
   var generator=KeyPairGenerator.getInstance("EC","BC");generator.initialize(new java.security.spec.ECGenParameterSpec("secp256r1"));var pair=generator.generateKeyPair();
   var encoder=Base64.getUrlEncoder().withoutPadding();
   String pub=encoder.encodeToString(((ECPublicKey)pair.getPublic()).getQ().getEncoded(false));
   byte[] raw=((ECPrivateKey)pair.getPrivate()).getD().toByteArray();byte[] fixed=new byte[32];
   System.arraycopy(raw,Math.max(0,raw.length-32),fixed,Math.max(0,32-raw.length),Math.min(32,raw.length));
   String secret=encrypt(encoder.encodeToString(fixed));
   jdbc.update("INSERT INTO notification_vapid(id,public_key,private_key) VALUES(1,?,?) ON CONFLICT(id) DO NOTHING",pub,secret);
   return jdbc.queryForMap("SELECT public_key,private_key FROM notification_vapid WHERE id=1");
  }catch(GeneralSecurityException ex){throw new IllegalStateException("Cannot initialize browser notifications",ex);}
 }
 public String decrypt(String encrypted){
  try{byte[] packed=Base64.getDecoder().decode(encrypted);var cipher=Cipher.getInstance("AES/GCM/NoPadding");
   cipher.init(Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,Arrays.copyOf(packed,12)));
   return new String(cipher.doFinal(Arrays.copyOfRange(packed,12,packed.length)),java.nio.charset.StandardCharsets.UTF_8);
  }catch(Exception ex){throw new IllegalStateException("Cannot decrypt notification credentials",ex);}
 }
 private String encrypt(String plain){
  try{byte[] iv=new byte[12];new SecureRandom().nextBytes(iv);var cipher=Cipher.getInstance("AES/GCM/NoPadding");
   cipher.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,iv));byte[] data=cipher.doFinal(plain.getBytes(java.nio.charset.StandardCharsets.UTF_8));
   byte[] packed=Arrays.copyOf(iv,iv.length+data.length);System.arraycopy(data,0,packed,iv.length,data.length);return Base64.getEncoder().encodeToString(packed);
  }catch(Exception ex){throw new IllegalStateException("Cannot encrypt notification credentials",ex);}
 }
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
