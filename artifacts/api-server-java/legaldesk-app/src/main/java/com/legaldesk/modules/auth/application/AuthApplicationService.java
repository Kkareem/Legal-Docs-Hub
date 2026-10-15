package com.legaldesk.modules.auth.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.auth.api.AuthUserResponse;
import com.legaldesk.modules.auth.api.LoginRequest;
import com.legaldesk.modules.auth.api.LoginResponse;
import com.legaldesk.modules.users.domain.UserEntity;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import com.legaldesk.shared.security.AppUserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthApplicationService {

    private final com.legaldesk.shared.security.JwtService jwt;
    @org.springframework.beans.factory.annotation.Value("${app.auth.secure-cookie:${SESSION_COOKIE_SECURE:false}}") private boolean secureCookie;
    private final AuthenticationManager authenticationManager;
    private final UserEntityRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder encoder;

    public AuthApplicationService(AuthenticationManager authenticationManager, UserEntityRepository userRepository, org.springframework.security.crypto.password.PasswordEncoder encoder, com.legaldesk.shared.security.JwtService jwt) {
        this.jwt=jwt;
        this.encoder = encoder;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
    }

    public LoginResponse login(LoginRequest request, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.nationalId(), request.password())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
        UserEntity user = userRepository.findById(principal.id())
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));

        var issued=jwt.issue(user);setCookie(servletResponse,issued.token(),jwt.minutes()*60L);servletResponse.setHeader("X-Session-Expires-At",issued.expiresAt().toString());
        return new LoginResponse(toAuthUser(user),issued.token(),issued.expiresAt());
    }

    public AuthUserResponse me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            throw new org.springframework.security.authentication.BadCredentialsException("Not authenticated");
        }
        UserEntity user = userRepository.findById(principal.id())
                .orElseThrow(() -> new NotFoundException("Not authenticated"));
        return toAuthUser(user);
    }

    public void logout(HttpServletRequest request,HttpServletResponse response) {
        String token=com.legaldesk.shared.security.JwtAuthenticationFilter.token(request);
        if(token!=null){try{jwt.revoke(token);}catch(org.springframework.security.authentication.BadCredentialsException ignored){}}
        setCookie(response,"",0);SecurityContextHolder.clearContext();
    }
    private void setCookie(HttpServletResponse response,String token,long seconds){response.addHeader("Set-Cookie",org.springframework.http.ResponseCookie.from(com.legaldesk.shared.security.JwtAuthenticationFilter.COOKIE,token).httpOnly(true).secure(secureCookie).sameSite("Strict").path("/api").maxAge(seconds).build().toString());}
    @org.springframework.transaction.annotation.Transactional
    public AuthUserResponse changePassword(com.legaldesk.modules.auth.api.ChangePasswordRequest request, Authentication authentication, HttpServletResponse response) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal))
            throw new org.springframework.security.authentication.BadCredentialsException("Not authenticated");
        UserEntity user = userRepository.findById(principal.id()).orElseThrow(() -> new NotFoundException("User not found"));
        if (!user.isActive() || !encoder.matches(request.currentPassword(), user.getPasswordHash()))
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid current password");
        if (encoder.matches(request.newPassword(), user.getPasswordHash()))
            throw new com.legaldesk.common.domain.BusinessRuleViolationException("Choose a different password");
        user.setPasswordHash(encoder.encode(request.newPassword()));
        user.setMustChangePassword(false);
        user.setAuthVersion(user.getAuthVersion()+1);
        userRepository.saveAndFlush(user);
        var issued=jwt.issue(user);setCookie(response,issued.token(),jwt.minutes()*60L);response.setHeader("X-Session-Expires-At",issued.expiresAt().toString());
        return toAuthUser(user);
    }

    private AuthUserResponse toAuthUser(UserEntity user) {
        return new AuthUserResponse(
                user.getId(),
                user.getName(),
                user.getNationalId(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isActive(),
                user.isMustChangePassword()
        );
    }
}
