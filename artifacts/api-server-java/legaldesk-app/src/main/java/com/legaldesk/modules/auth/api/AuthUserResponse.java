package com.legaldesk.modules.auth.api;

public record AuthUserResponse(
        Long id,
        String name,
        String email,
        String phone,
        String role,
        boolean active
) {
}
