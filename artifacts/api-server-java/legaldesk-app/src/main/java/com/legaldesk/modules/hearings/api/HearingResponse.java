package com.legaldesk.modules.hearings.api;

import java.time.OffsetDateTime;

public record HearingResponse(
        Long id,
        Long caseId,
        String caseNumber,
        OffsetDateTime datetime,
        String court,
        String type,
        Long assignedLawyer,
        String assignedLawyerName,
        String status,
        String notes,
        OffsetDateTime createdAt
) {
}
