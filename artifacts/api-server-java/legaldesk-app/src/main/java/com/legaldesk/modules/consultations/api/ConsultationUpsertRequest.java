package com.legaldesk.modules.consultations.api;

import java.math.BigDecimal;

public record ConsultationUpsertRequest(
        Long clientId,
        String summary,
        String paymentStatus,
        BigDecimal fee,
        String status,
        Long assignedTo,
        String response
) {
}
