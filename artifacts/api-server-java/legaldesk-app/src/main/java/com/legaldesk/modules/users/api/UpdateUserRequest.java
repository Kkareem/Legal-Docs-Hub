package com.legaldesk.modules.users.api;

public record UpdateUserRequest(
        String name,
        String phone,
        String role,
        Boolean active,
        String password
) {
}
