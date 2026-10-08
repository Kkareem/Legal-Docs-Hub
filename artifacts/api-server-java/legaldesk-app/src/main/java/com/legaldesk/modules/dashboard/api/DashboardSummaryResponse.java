package com.legaldesk.modules.dashboard.api;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
        long totalVisitors,
        long activeCases,
        long totalClients,
        long pendingTasks,
        long overdueTasks,
        long todayHearings,
        long upcomingHearings,
        long pendingConsultations,
        BigDecimal totalPendingPayments,
        long powersOfAttorneyOut,
        long overduePoAs,
        List<CountByLabelResponse> casesByStatus,
        List<CountByLabelResponse> casesByType,
        List<CountByLabelResponse> tasksByLawyer
) {
}
