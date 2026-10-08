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
        String description,
        @jakarta.validation.constraints.Size(max=100) java.util.List<@jakarta.validation.constraints.NotNull Long> clientIds,
        @jakarta.validation.constraints.Size(max=100) java.util.List<@jakarta.validation.constraints.NotNull Long> lawyerIds
) {
}
