package com.legaldesk.modules.clients.api;

import jakarta.validation.constraints.NotBlank;

public record CreateClientRequest(
        @NotBlank String name,
        String phone,
        String email,
        String nationalId,
        String address,
        String status,
        String serviceType,
        String notes,
        Long userId
) {
}
