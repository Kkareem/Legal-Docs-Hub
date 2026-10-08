package com.legaldesk.modules.cases.api;

import java.time.OffsetDateTime;

public record CaseResponse(
        Long id,
        String caseNumber,
        String courtCaseNumber,
        String type,
        String court,
        String division,
        Long clientId,
        String clientName,
        Long leadLawyerId,
        String leadLawyerName,
        String status,
        String opposingParty,
        String description,
        Long officeId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        java.util.List<java.util.Map<String,Object>> clients,
        java.util.List<java.util.Map<String,Object>> lawyers
) {
}
