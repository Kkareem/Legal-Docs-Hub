package com.legaldesk.modules.settings.api;
import com.legaldesk.modules.settings.application.SettingsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
@RestController
@RequestMapping("/api/settings/office")
@PreAuthorize("hasAnyRole('ADMIN','OWNER')")
public class OfficeSettingsController {
 @org.springframework.beans.factory.annotation.Autowired private com.legaldesk.modules.settings.application.SmsService sms;
 private final SettingsService settings;
 public OfficeSettingsController(SettingsService settings){this.settings=settings;}
 public record Session(@Min(5) @Max(1440) int durationMinutes,@Min(2) @Max(15) int codeMinutes,@Min(5) @Max(60) int accessMinutes,@Min(3) @Max(10) int maxAttempts,@Min(30) @Max(300) int resendSeconds,@Min(5) @Max(60) Integer passwordResetMinutes){}
 public record Application(@NotBlank @Pattern(regexp="[A-Z]{3}") String currency){}
 public record Sms(@NotNull Boolean enabled,@NotNull @Size(max=100) String accountSid,@NotNull @Size(max=100) String sender,@Size(max=500) String authToken){}
 @GetMapping("/sms") public Map<String,Object> sms(){return sms.publicSettings();}
 @PutMapping("/sms") public void saveSms(@Valid @RequestBody Sms r){sms.save(r.enabled(),r.accountSid().trim(),r.sender().trim(),r.authToken());}
 @GetMapping public Map<String,Object> get(){var auth=new LinkedHashMap<String,Object>(settings.get("auth.session"));auth.putAll(settings.get("auth.verification"));auth.put("passwordResetMinutes",settings.get("auth.passwordReset").getOrDefault("durationMinutes",15));return Map.of("auth",auth,"application",Map.of("currency",settings.currency()),"phoneVerificationReady",sms.ready());}
 @org.springframework.transaction.annotation.Transactional
 @PutMapping("/session") public void saveSession(@Valid @RequestBody Session r){if(r.passwordResetMinutes()!=null)settings.put("auth.passwordReset",Map.of("durationMinutes",r.passwordResetMinutes()));settings.put("auth.session",Map.of("durationMinutes",r.durationMinutes()));settings.put("auth.verification",Map.of("codeMinutes",r.codeMinutes(),"accessMinutes",r.accessMinutes(),"maxAttempts",r.maxAttempts(),"resendSeconds",r.resendSeconds()));}
 @PutMapping("/application") public void saveApplication(@Valid @RequestBody Application r){try{Currency.getInstance(r.currency());}catch(IllegalArgumentException e){throw new com.legaldesk.common.domain.BusinessRuleViolationException("Invalid currency");}var value=settings.get("application");value.put("currency",r.currency());settings.put("application",value);}
}
