package com.legaldesk.modules.payments.api;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PaymentUpsertRequest(
        Long clientId,
        Long caseId,
        Long consultationId,
        BigDecimal amount,
        String type,
        String status,
        OffsetDateTime paidAt,
        String notes
) {
}
