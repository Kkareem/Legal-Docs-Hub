package com.legaldesk.modules.cases.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCaseRequest(
        @NotBlank String caseNumber,
        String courtCaseNumber,
        @NotBlank String type,
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
