package com.legaldesk.modules.payments.api;

import java.math.BigDecimal;
import java.util.List;

public record PaymentSummaryResponse(
        BigDecimal totalCollected,
        BigDecimal totalPending,
        BigDecimal totalOverdue,
        List<PaymentResponse> recentPayments,
        List<DebtorItemResponse> topDebtors
) {
}
