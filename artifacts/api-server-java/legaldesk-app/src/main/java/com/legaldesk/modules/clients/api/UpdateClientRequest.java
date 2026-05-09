package com.legaldesk.modules.clients.api;

public record UpdateClientRequest(
        String name,
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
