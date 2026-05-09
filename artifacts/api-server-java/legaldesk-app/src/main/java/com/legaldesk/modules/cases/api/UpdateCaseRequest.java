package com.legaldesk.modules.cases.api;

public record UpdateCaseRequest(
        String caseNumber,
        String courtCaseNumber,
        String type,
        String court,
        String division,
        Long clientId,
        Long leadLawyerId,
        String status,
        String opposingParty,
        String description
) {
}
