package com.legaldesk.modules.clients.api;

import java.math.BigDecimal;

public record ClientSummaryResponse(
        Long clientId,
        BigDecimal totalPaid,
        BigDecimal totalDue,
        long activeCases,
        long totalCases,
        long pendingTasks
) {
}
