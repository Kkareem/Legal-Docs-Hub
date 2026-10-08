package com.legaldesk.modules.notifications.api;
import com.legaldesk.modules.notifications.application.NotificationSettingsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class NotificationSettingsController {
 private final NotificationSettingsService service;
 public NotificationSettingsController(NotificationSettingsService service){this.service=service;}
 public record Preferences(@NotNull Boolean siteEnabled,@NotNull Boolean emailEnabled,@NotNull Boolean browserEnabled){}
 public record Subscription(@NotBlank @Size(max=4096) String endpoint,@NotBlank @Size(max=200) String p256dh,@NotBlank @Size(max=100) String auth){}
 public record Endpoint(@NotBlank @Size(max=4096) String endpoint){}
 public record EmailSettings(@NotNull Boolean enabled,@NotNull @Email @Size(max=320) String email,@Size(max=500) String password){}
 @GetMapping("/api/settings/application") public Map<String,Object> config(){return service.config();}
 @GetMapping("/api/notifications/preferences") public Map<String,Object> preferences(){return service.preferences();}
 @PutMapping("/api/notifications/preferences") public Map<String,Object> save(@Valid @RequestBody Preferences r){return service.savePreferences(r.siteEnabled(),r.emailEnabled(),r.browserEnabled());}
 @PostMapping("/api/notifications/subscriptions") public void subscribe(@Valid @RequestBody Subscription r){service.subscribe(r.endpoint(),r.p256dh(),r.auth());}
 @DeleteMapping("/api/notifications/subscriptions") public void unsubscribe(@Valid @RequestBody Endpoint r){service.unsubscribe(r.endpoint());}
 @GetMapping("/api/settings/email") @PreAuthorize("hasAnyRole('ADMIN','OWNER')") public Map<String,Object> email(){return service.emailSettings();}
 @PutMapping("/api/settings/email") @PreAuthorize("hasAnyRole('ADMIN','OWNER')") public void saveEmail(@Valid @RequestBody EmailSettings r){service.saveEmail(r.enabled(),"smtp.gmail.com",587,r.email(),r.password()==null?null:r.password().replace(" ",""),r.email(),"starttls");}
}
