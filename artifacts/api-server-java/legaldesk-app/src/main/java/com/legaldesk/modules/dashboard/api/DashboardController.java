package com.legaldesk.modules.dashboard.api;

import com.legaldesk.modules.dashboard.application.DashboardQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardQueryService service;
    public DashboardController(DashboardQueryService service) { this.service = service; }
    @GetMapping("/summary") public DashboardSummaryResponse summary() { return service.summary(); }
    @GetMapping("/upcoming-hearings") public java.util.List<com.legaldesk.modules.hearings.api.HearingResponse> upcomingHearings() { return service.upcomingHearings(); }
    @GetMapping("/overdue-tasks") public java.util.List<com.legaldesk.modules.tasks.api.TaskResponse> overdueTasks() { return service.overdueTasks(); }
    @GetMapping("/recent-activity") public java.util.List<ActivityItemResponse> recentActivity() { return service.recentActivity(); }
}
