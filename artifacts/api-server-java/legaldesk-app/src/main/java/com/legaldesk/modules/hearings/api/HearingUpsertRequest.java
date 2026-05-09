package com.legaldesk.modules.hearings.api;

import java.time.OffsetDateTime;

public record HearingUpsertRequest(
        Long caseId,
        OffsetDateTime datetime,
        String court,
        String type,
        Long assignedLawyer,
        String status,
        String notes
) {
}
