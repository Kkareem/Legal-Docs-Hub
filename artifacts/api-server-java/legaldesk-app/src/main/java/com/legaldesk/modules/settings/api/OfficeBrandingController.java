package com.legaldesk.modules.settings.api;
import com.legaldesk.modules.settings.application.SettingsService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class OfficeBrandingController {
 private final SettingsService settings;
 public OfficeBrandingController(SettingsService settings){this.settings=settings;}
 @GetMapping("/api/public/office") public Map<String,String> office(){return Map.of("officeName",settings.officeName());}
}
