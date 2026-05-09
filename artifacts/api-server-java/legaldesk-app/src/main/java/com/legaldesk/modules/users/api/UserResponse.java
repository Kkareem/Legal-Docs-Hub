package com.legaldesk.modules.users.api;

import java.time.OffsetDateTime;

public record UserResponse(
        Long id,
        String name,
        String email,
        String phone,
        String role,
        Long officeId,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
