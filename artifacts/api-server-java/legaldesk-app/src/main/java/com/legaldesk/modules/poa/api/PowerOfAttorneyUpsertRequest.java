package com.legaldesk.modules.poa.api;

import java.time.OffsetDateTime;

public record PowerOfAttorneyUpsertRequest(
        Long clientId,
        Long caseId,
        Long receivedBy,
        String handedBy,
        OffsetDateTime receivedAt,
        OffsetDateTime returnBy,
        OffsetDateTime returnedAt,
        String status,
        String notes
) {
}
