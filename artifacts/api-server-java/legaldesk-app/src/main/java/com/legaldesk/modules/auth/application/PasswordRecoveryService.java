package com.legaldesk.modules.auth.application;
import java.util.*;
import java.security.*;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import com.legaldesk.modules.settings.application.SettingsService;
import com.legaldesk.modules.notifications.application.NotificationSettingsService;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.legaldesk.common.domain.BusinessRuleViolationException;

@Service
public class PasswordRecoveryService {
 @org.springframework.beans.factory.annotation.Autowired private AccountChangeMessages accountMessages;
 private final JdbcTemplate jdbc;private final SettingsService settings;private final NotificationSettingsService mail;private final UserEntityRepository users;private final PasswordEncoder encoder;
 public PasswordRecoveryService(JdbcTemplate jdbc,SettingsService settings,NotificationSettingsService mail,UserEntityRepository users,PasswordEncoder encoder){this.jdbc=jdbc;this.settings=settings;this.mail=mail;this.users=users;this.encoder=encoder;}
 private String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
 private boolean allow(String scope,int max){int count=jdbc.queryForObject("INSERT INTO password_reset_limits(scope_hash,attempts) VALUES(?,1) ON CONFLICT(scope_hash) DO UPDATE SET attempts=CASE WHEN password_reset_limits.window_start<NOW()-INTERVAL '1 hour' THEN 1 ELSE password_reset_limits.attempts+1 END,window_start=CASE WHEN password_reset_limits.window_start<NOW()-INTERVAL '1 hour' THEN NOW() ELSE password_reset_limits.window_start END RETURNING attempts",Integer.class,hash(scope));return count<=max;}
 @Transactional public void request(String identity,String address){
  boolean addressAllowed=allow("ip:"+address,20),identityAllowed=allow("id:"+identity,3);if(!addressAllowed||!identityAllowed)return;
  var user=users.findByNationalId(identity).orElse(null);if(user==null||!user.isActive()||user.getEmail()==null||user.getEmail().isBlank()||!mail.emailEnabled())return;
  jdbc.queryForList("SELECT id FROM users WHERE id=? FOR UPDATE",user.getId());
  byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  int minutes=((Number)settings.get("auth.passwordReset").getOrDefault("durationMinutes",15)).intValue();minutes=Math.max(5,Math.min(60,minutes));
  jdbc.update("UPDATE password_reset_tokens SET used_at=NOW() WHERE user_id=? AND used_at IS NULL",user.getId());
  jdbc.update("INSERT INTO password_reset_tokens(token_hash,user_id,auth_version,expires_at) VALUES(?,?,?,NOW()+make_interval(mins=>?))",hash(token),user.getId(),user.getAuthVersion(),minutes);
  final int lifetime=minutes;
  org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization(){@Override public void afterCommit(){Thread.startVirtualThread(()->{
   try{mail.sendMessage(user.getEmail(),"إعادة ضبط كلمة المرور","طلبت إعادة ضبط كلمة المرور. الرابط صالح لمدة "+lifetime+" دقيقة ويُستخدم مرة واحدة:\n"+settings.publicUrl()+"/reset-password#token="+token+"\nإذا لم تطلب ذلك، تجاهل الرسالة.");}
   catch(RuntimeException e){jdbc.update("DELETE FROM password_reset_tokens WHERE token_hash=?",hash(token));org.slf4j.LoggerFactory.getLogger(PasswordRecoveryService.class).warn("Password recovery email delivery failed");}
  });}});

 }
 @Transactional public void reset(String token,String password){
  var candidates=jdbc.queryForList("SELECT user_id FROM password_reset_tokens WHERE token_hash=?",hash(token));if(candidates.isEmpty())throw invalid();
  long userId=((Number)candidates.getFirst().get("user_id")).longValue();
  jdbc.queryForList("SELECT id FROM users WHERE id=? FOR UPDATE",userId);
  var rows=jdbc.queryForList("SELECT auth_version FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>NOW() FOR UPDATE",hash(token));
  var user=users.findById(userId).orElseThrow(this::invalid);
  if(rows.isEmpty()||!user.isActive()||user.getAuthVersion()!=((Number)rows.getFirst().get("auth_version")).intValue())throw invalid();
  if(encoder.matches(password,user.getPasswordHash()))throw new BusinessRuleViolationException("اختر كلمة مرور مختلفة عن كلمة المرور الحالية");
  user.setPasswordHash(encoder.encode(password));user.setMustChangePassword(false);user.setAuthVersion(user.getAuthVersion()+1);users.saveAndFlush(user);
  jdbc.update("UPDATE password_reset_tokens SET used_at=NOW() WHERE user_id=? AND used_at IS NULL",userId);
  accountMessages.record(userId,"تمت إعادة ضبط كلمة مرور حسابك","تمت إعادة ضبط كلمة مرور حسابك بنجاح. تم إنهاء جلسات الدخول السابقة.",user.getEmail());
 }
 private BusinessRuleViolationException invalid(){return new BusinessRuleViolationException("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.");}
}
