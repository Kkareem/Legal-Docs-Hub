package com.legaldesk.modules.consultations.application;
import com.legaldesk.modules.settings.application.*;
import com.legaldesk.modules.notifications.application.NotificationSettingsService;
import com.legaldesk.shared.security.ContactDetails;
import com.legaldesk.common.domain.*;
import java.util.*;
import java.time.*;
import java.security.*;
import javax.crypto.*;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.authentication.BadCredentialsException;
@Service
public class ConsultationVerificationService {
 private final JdbcTemplate jdbc;private final NotificationSettingsService mail;private final SettingsService settings;private final SmsService sms;private final byte[] key;private final SecureRandom random=new SecureRandom();
 public ConsultationVerificationService(JdbcTemplate jdbc,NotificationSettingsService mail,SettingsService settings,SettingsCipher cipher,SmsService sms){this.sms=sms;this.jdbc=jdbc;this.mail=mail;this.settings=settings;byte[] secret=new byte[32];random.nextBytes(secret);settings.initialize("auth.verification",Map.of("codeMinutes",5,"accessMinutes",15,"maxAttempts",5,"resendSeconds",60));settings.initialize("auth.verification.key",Map.of("encryptedKey",cipher.encrypt(Base64.getEncoder().encodeToString(secret))));key=Base64.getDecoder().decode(cipher.decrypt((String)settings.get("auth.verification.key").get("encryptedKey")));}
 private int option(String name){return ((Number)settings.get("auth.verification").get(name)).intValue();}
 private String hash(String value){try{Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(key,"HmacSHA256"));return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
 @Transactional public Map<String,Object> request(String input,String ip){
  String contact=ContactDetails.lookup(input);String channel=contact.contains("@")?"email":"phone";
  if("phone".equals(channel)&&!sms.ready())throw new BusinessRuleViolationException("Phone verification is not configured. Use email or contact the office");
  if("email".equals(channel)&&!mail.emailEnabled())throw new BusinessRuleViolationException("Office Gmail must be enabled to send verification codes");
  // Serialize the quota check across requests so concurrent resends cannot bypass it.
  jdbc.queryForList("SELECT name FROM settings WHERE name='auth.verification' FOR UPDATE");
  String ipHash=hash("ip:"+ip);
  long count=jdbc.queryForObject("SELECT COUNT(*) FROM consultation_verifications WHERE (contact=? OR ip_hash=?) AND created_at>NOW()-INTERVAL '15 minutes'",Long.class,contact,ipHash);
  long recent=jdbc.queryForObject("SELECT COUNT(*) FROM consultation_verifications WHERE contact=? AND created_at>NOW()-(?*INTERVAL '1 second')",Long.class,contact,option("resendSeconds"));
  long contactCount=jdbc.queryForObject("SELECT COUNT(*) FROM consultation_verifications WHERE contact=? AND created_at>NOW()-INTERVAL '15 minutes'",Long.class,contact);
  if(count>=10||contactCount>=3||recent>0)throw new BusinessRuleViolationException("Please wait before requesting another verification code");
  UUID id=UUID.randomUUID();String code=String.format(Locale.ROOT,"%06d",random.nextInt(1000000));
  jdbc.update("INSERT INTO consultation_verifications(id,contact,channel,ip_hash,code_hash,expires_at) VALUES(?,?,?,?,?,?)",id,contact,channel,ipHash,hash("code:"+id+":"+code),OffsetDateTime.now().plusMinutes(option("codeMinutes")));
  try{if("phone".equals(channel))sms.sendCode(contact,code,option("codeMinutes"));else mail.sendMessage(contact,"رمز متابعة الاستشارات — LegalDesk","رمز التحقق الخاص بك: "+code+"\nصالح لمدة "+option("codeMinutes")+" دقائق. لا تشاركه مع أي شخص.");}catch(Exception ex){throw new BusinessRuleViolationException("Cannot send verification code. Contact the office or try again later");}
  return Map.of("challengeId",id,"expiresInSeconds",option("codeMinutes")*60,"resendAfterSeconds",option("resendSeconds"));
 }
 @Transactional(noRollbackFor=BadCredentialsException.class) public Map<String,Object> verify(UUID id,String code){
  var rows=jdbc.queryForList("SELECT *,expires_at>NOW() AS valid FROM consultation_verifications WHERE id=? FOR UPDATE",id);
  if(rows.isEmpty())throw invalid();var row=rows.getFirst();
  if(Boolean.TRUE.equals(row.get("verified"))||((Number)row.get("attempts")).intValue()>=option("maxAttempts")||!Boolean.TRUE.equals(row.get("valid")))throw invalid();
  jdbc.update("UPDATE consultation_verifications SET attempts=attempts+1 WHERE id=?",id);
  if(!MessageDigest.isEqual(hash("code:"+id+":"+code).getBytes(StandardCharsets.UTF_8),((String)row.get("code_hash")).getBytes(StandardCharsets.UTF_8)))throw invalid();
  byte[] bytes=new byte[32];random.nextBytes(bytes);String access=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);OffsetDateTime expires=OffsetDateTime.now().plusMinutes(option("accessMinutes"));
  jdbc.update("UPDATE consultation_verifications SET verified=TRUE,access_hash=?,access_expires_at=? WHERE id=?",hash("access:"+access),expires,id);
  return Map.of("accessToken",access,"expiresAt",expires,"contact",row.get("contact"));
 }
 public String contact(String access){var rows=jdbc.queryForList("SELECT contact FROM consultation_verifications WHERE verified AND access_hash=? AND access_expires_at>NOW()",String.class,hash("access:"+access));if(rows.isEmpty())throw invalid();return rows.getFirst();}
 private BadCredentialsException invalid(){return new BadCredentialsException("Invalid or expired verification code");}
}
