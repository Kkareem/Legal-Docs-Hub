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

    private final AuthApplicationService authApplicationService;

    public AuthController(AuthApplicationService authApplicationService) {
        this.authApplicationService = authApplicationService;
    }

    @GetMapping("/me")
    public AuthUserResponse me(Authentication authentication) {
        return authApplicationService.me(authentication);
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
    public ResponseEntity<Map<String, Boolean>> logout(HttpServletRequest request) {
        authApplicationService.logout(request);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/change-password")
    public AuthUserResponse changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        return authApplicationService.changePassword(request, authentication);
    }
}
