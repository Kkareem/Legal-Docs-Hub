package com.legaldesk.modules.consultations.api;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ConsultationResponse(
        Long id,
        Long clientId,
        String clientName,
        String summary,
        String paymentStatus,
        BigDecimal fee,
        String status,
        Long assignedTo,
        String assigneeName,
        String response,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
