package com.legaldesk.modules.settings.application;
import java.util.*;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Service;
import com.legaldesk.common.domain.BusinessRuleViolationException;
@Service
public class SmsService {
 private final SettingsService settings;private final SettingsCipher cipher;private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NEVER).build();
 public SmsService(SettingsService settings,SettingsCipher cipher){this.settings=settings;this.cipher=cipher;settings.initialize("office.sms",Map.of("enabled",false,"provider","twilio","accountSid","","authTokenEncrypted","","sender",""));}
 public boolean ready(){var s=settings.get("office.sms");return Boolean.TRUE.equals(s.get("enabled"))&&!Objects.toString(s.get("authTokenEncrypted"),"").isBlank();}
 public Map<String,Object> publicSettings(){var s=settings.get("office.sms");s.remove("authTokenEncrypted");s.put("tokenConfigured",!Objects.toString(settings.get("office.sms").get("authTokenEncrypted"),"").isBlank());return s;}
 @org.springframework.transaction.annotation.Transactional public void save(boolean enabled,String sid,String sender,String token){var s=settings.lock("office.sms");String secret=Objects.toString(s.get("authTokenEncrypted"),"");if(token!=null&&!token.isBlank())secret=cipher.encrypt(token.trim());if(enabled&&(!sid.matches("AC[0-9a-fA-F]{32}")||sender.isBlank()||secret.isBlank()))throw new BusinessRuleViolationException("Twilio account, sender and authentication token are required");settings.put("office.sms",Map.of("enabled",enabled,"provider","twilio","accountSid",sid,"sender",sender,"authTokenEncrypted",secret));}
 public void sendCode(String to,String code,int minutes){if(!ready())throw new BusinessRuleViolationException("Phone verification is not configured. Use email or contact the office");if(!to.matches("\\+[1-9][0-9]{6,14}"))throw new BusinessRuleViolationException("Phone must include its international country code");var s=settings.get("office.sms");String sid=(String)s.get("accountSid");String password=cipher.decrypt((String)s.get("authTokenEncrypted"));String body="To="+encode(to)+"&From="+encode((String)s.get("sender"))+"&Body="+encode("LegalDesk verification code: "+code+". Valid for "+minutes+" minutes.");try{var request=HttpRequest.newBuilder(URI.create("https://api.twilio.com/2010-04-01/Accounts/"+sid+"/Messages.json")).timeout(Duration.ofSeconds(15)).header("Authorization","Basic "+Base64.getEncoder().encodeToString((sid+":"+password).getBytes(StandardCharsets.UTF_8))).header("Content-Type","application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(body)).build();int status=client.send(request,HttpResponse.BodyHandlers.discarding()).statusCode();if(status<200||status>=300)throw new IllegalStateException("SMS delivery failed");}catch(Exception e){if(e instanceof InterruptedException)Thread.currentThread().interrupt();throw new BusinessRuleViolationException("Cannot send verification code. Check office SMS settings");}}
 private String encode(String s){return URLEncoder.encode(s,StandardCharsets.UTF_8);}
}
