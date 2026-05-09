package com.legaldesk.modules.notifications.api;

import java.time.OffsetDateTime;

public record NotificationResponse(
        Long id,
        Long userId,
        String type,
        String title,
        String body,
        boolean read,
        Long refId,
        String refType,
        OffsetDateTime createdAt
) {
}
