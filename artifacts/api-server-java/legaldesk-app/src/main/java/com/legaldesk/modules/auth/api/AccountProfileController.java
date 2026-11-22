package com.legaldesk.modules.auth.api;
import com.legaldesk.modules.auth.application.AccountProfileService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import java.io.IOException;

@RestController
@RequestMapping("/api/account")
public class AccountProfileController {
 private final AccountProfileService service;
 public AccountProfileController(AccountProfileService service){this.service=service;}
 public record Contact(@Email @Size(max=254) String email,@Size(max=40) String phone,@NotBlank @Size(max=128) String currentPassword){}
 @GetMapping public AccountProfileService.Profile profile(Authentication a){return service.get(a);}
 @PatchMapping public AccountProfileService.Profile update(@Valid @RequestBody Contact r,Authentication a){return service.update(r.email(),r.phone(),r.currentPassword(),a);}
 @PostMapping("/avatar") public AccountProfileService.Profile avatar(@RequestParam("file")MultipartFile file,Authentication a)throws IOException{return service.avatar(file,a);}
 @GetMapping("/avatar") public ResponseEntity<byte[]> avatar(Authentication a){return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).header("Cache-Control","private, no-store").header("X-Content-Type-Options","nosniff").body(service.avatarContent(a));}
}
