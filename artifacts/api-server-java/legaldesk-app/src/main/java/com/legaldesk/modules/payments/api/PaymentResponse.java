package com.legaldesk.modules.payments.api;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PaymentResponse(
        Long id,
        Long clientId,
        String clientName,
        Long caseId,
        String caseNumber,
        Long consultationId,
        BigDecimal amount,
        String type,
        String status,
        OffsetDateTime paidAt,
        String notes,
        OffsetDateTime createdAt
) {
}
