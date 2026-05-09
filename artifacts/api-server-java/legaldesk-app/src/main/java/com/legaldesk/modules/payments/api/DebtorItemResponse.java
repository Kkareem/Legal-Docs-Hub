package com.legaldesk.modules.payments.api;

import java.math.BigDecimal;

public record DebtorItemResponse(Long clientId, String clientName, BigDecimal amountDue) {
}
