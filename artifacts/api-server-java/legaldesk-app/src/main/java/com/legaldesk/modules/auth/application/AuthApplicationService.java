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

    private final AuthenticationManager authenticationManager;
    private final UserEntityRepository userRepository;

    public AuthApplicationService(AuthenticationManager authenticationManager, UserEntityRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
    }

    public LoginResponse login(LoginRequest request, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        servletRequest.getSession(true)
                .setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
        UserEntity user = userRepository.findById(principal.id())
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));

        return new LoginResponse(toAuthUser(user), "session");
    }

    public AuthUserResponse me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            throw new NotFoundException("Not authenticated");
        }
        UserEntity user = userRepository.findById(principal.id())
                .orElseThrow(() -> new NotFoundException("Not authenticated"));
        return toAuthUser(user);
    }

    public void logout(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    private AuthUserResponse toAuthUser(UserEntity user) {
        return new AuthUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isActive()
        );
    }
}
