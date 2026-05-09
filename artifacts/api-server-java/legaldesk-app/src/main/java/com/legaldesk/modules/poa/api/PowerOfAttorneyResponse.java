package com.legaldesk.modules.poa.api;

import java.time.OffsetDateTime;

public record PowerOfAttorneyResponse(
        Long id,
        Long clientId,
        String clientName,
        Long caseId,
        String caseNumber,
        Long receivedBy,
        String receivedByName,
        String handedBy,
        OffsetDateTime receivedAt,
        OffsetDateTime returnBy,
        OffsetDateTime returnedAt,
        String status,
        String notes,
        OffsetDateTime createdAt
) {
}
