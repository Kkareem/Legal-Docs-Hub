package com.legaldesk.modules.auth.api;

import com.legaldesk.modules.auth.application.AuthApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @org.springframework.beans.factory.annotation.Autowired private com.legaldesk.shared.security.JwtService jwt;
    private final AuthApplicationService authApplicationService;

    public AuthController(AuthApplicationService authApplicationService) {
        this.authApplicationService = authApplicationService;
    }

    @GetMapping("/me")
    public AuthUserResponse me(Authentication authentication,HttpServletRequest request,HttpServletResponse response) {
        var user=authApplicationService.me(authentication);
        try{var claims=jwt.validate(com.legaldesk.shared.security.JwtAuthenticationFilter.token(request));response.setHeader("X-Session-Expires-At",java.time.Instant.ofEpochSecond(claims.getExpirationTime().getValue()).toString());}catch(org.jose4j.jwt.MalformedClaimException ex){throw new org.springframework.security.authentication.BadCredentialsException("Invalid token");}
        return user;
    }

    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse
    ) {
        return authApplicationService.login(request, servletRequest, servletResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Boolean>> logout(HttpServletRequest request,HttpServletResponse response) {
        authApplicationService.logout(request,response);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/change-password")
    public AuthUserResponse changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication,HttpServletResponse response) {
        return authApplicationService.changePassword(request, authentication,response);
    }

    @org.springframework.beans.factory.annotation.Autowired private com.legaldesk.modules.auth.application.PasswordRecoveryService recovery;
    public record ForgotPassword(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Pattern(regexp="[0-9]{14}") String nationalId){}
    public record ResetPassword(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Pattern(regexp="[A-Za-z0-9_-]{43}") String token,@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(min=10,max=128) String newPassword){}
    @PostMapping("/forgot-password")
    public Map<String,String> forgotPassword(@Valid @RequestBody ForgotPassword r,HttpServletRequest request){recovery.request(r.nationalId(),request.getRemoteAddr());return Map.of("message","إذا كان الحساب نشطًا وله بريد مسجل، سيصلك رابط استعادة كلمة المرور. إذا لم يصلك، تواصل مع المكتب.");}
    @PostMapping("/reset-password")
    public Map<String,String> resetPassword(@Valid @RequestBody ResetPassword r,HttpServletResponse response){recovery.reset(r.token(),r.newPassword());response.addHeader("Set-Cookie",org.springframework.http.ResponseCookie.from(com.legaldesk.shared.security.JwtAuthenticationFilter.COOKIE,"").httpOnly(true).sameSite("Strict").path("/api").maxAge(0).build().toString());return Map.of("message","تم تغيير كلمة المرور. سجّل الدخول بكلمة المرور الجديدة.");}
}
