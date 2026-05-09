package com.legaldesk.modules.dashboard.api;

import java.time.OffsetDateTime;

public record ActivityItemResponse(
        Long id,
        String type,
        String title,
        String description,
        String actor,
        String entityType,
        Long entityId,
        OffsetDateTime createdAt
) {
}
