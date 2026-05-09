package com.legaldesk.modules.cases.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCaseRequest(
        @NotBlank String caseNumber,
        String courtCaseNumber,
        @NotBlank String type,
        String court,
        String division,
        @NotNull Long clientId,
        Long leadLawyerId,
        String status,
        String opposingParty,
        String description
) {
}
