package com.legaldesk.modules.clients.api;

import java.time.OffsetDateTime;

public record ClientResponse(
        Long id,
        String name,
        String phone,
        String email,
        String nationalId,
        String address,
        Long officeId,
        String status,
        String serviceType,
        String notes,
        Long userId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
