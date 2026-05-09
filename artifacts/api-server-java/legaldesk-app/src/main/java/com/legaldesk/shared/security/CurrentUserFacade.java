package com.legaldesk.shared.security;

import com.legaldesk.common.domain.NotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserFacade {

    public Long currentUserIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            return null;
        }
        return principal.id();
    }

    public Long currentUserId() {
        Long currentUserId = currentUserIdOrNull();
        if (currentUserId == null) {
            throw new NotFoundException("Authenticated user not found");
        }
        return currentUserId;
    }
}
