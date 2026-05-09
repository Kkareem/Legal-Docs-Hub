package com.legaldesk.modules.dashboard.application;

import com.legaldesk.modules.audit.infrastructure.AuditLogEntityRepository;
import com.legaldesk.modules.cases.infrastructure.CaseEntityRepository;
import com.legaldesk.modules.clients.infrastructure.ClientEntityRepository;
import com.legaldesk.modules.consultations.infrastructure.ConsultationEntityRepository;
import com.legaldesk.modules.dashboard.api.CountByLabelResponse;
import com.legaldesk.modules.dashboard.api.DashboardSummaryResponse;
import com.legaldesk.modules.dashboard.api.ActivityItemResponse;
import com.legaldesk.modules.hearings.application.HearingApplicationService;
import com.legaldesk.modules.hearings.api.HearingResponse;
import com.legaldesk.modules.hearings.infrastructure.HearingEntityRepository;
import com.legaldesk.modules.notifications.infrastructure.NotificationEntityRepository;
import com.legaldesk.modules.payments.api.PaymentResponse;
import com.legaldesk.modules.payments.application.PaymentApplicationService;
import com.legaldesk.modules.payments.infrastructure.PaymentEntityRepository;
import com.legaldesk.modules.poa.infrastructure.PowerOfAttorneyEntityRepository;
import com.legaldesk.modules.tasks.api.TaskResponse;
import com.legaldesk.modules.tasks.application.TaskApplicationService;
import com.legaldesk.modules.tasks.infrastructure.TaskEntityRepository;
import com.legaldesk.shared.support.ReferenceLookupService;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardQueryService {
    private final CaseEntityRepository caseRepository;
    private final ClientEntityRepository clientRepository;
    private final TaskEntityRepository taskRepository;
    private final HearingEntityRepository hearingRepository;
    private final ConsultationEntityRepository consultationRepository;
    private final PaymentEntityRepository paymentRepository;
    private final PowerOfAttorneyEntityRepository poaRepository;
    private final AuditLogEntityRepository auditLogRepository;
    private final TaskApplicationService taskApplicationService;
    private final HearingApplicationService hearingApplicationService;
    private final PaymentApplicationService paymentApplicationService;
    private final ReferenceLookupService referenceLookupService;

    public DashboardQueryService(CaseEntityRepository caseRepository, ClientEntityRepository clientRepository,
                                 TaskEntityRepository taskRepository, HearingEntityRepository hearingRepository,
                                 ConsultationEntityRepository consultationRepository, PaymentEntityRepository paymentRepository,
                                 PowerOfAttorneyEntityRepository poaRepository, AuditLogEntityRepository auditLogRepository,
                                 TaskApplicationService taskApplicationService, HearingApplicationService hearingApplicationService,
                                 PaymentApplicationService paymentApplicationService, ReferenceLookupService referenceLookupService) {
        this.caseRepository = caseRepository;
        this.clientRepository = clientRepository;
        this.taskRepository = taskRepository;
        this.hearingRepository = hearingRepository;
        this.consultationRepository = consultationRepository;
        this.paymentRepository = paymentRepository;
        this.poaRepository = poaRepository;
        this.auditLogRepository = auditLogRepository;
        this.taskApplicationService = taskApplicationService;
        this.hearingApplicationService = hearingApplicationService;
        this.paymentApplicationService = paymentApplicationService;
        this.referenceLookupService = referenceLookupService;
    }
    public DashboardSummaryResponse summary() {
        var cases = caseRepository.findAll();
        var tasks = taskRepository.findAll();
        var hearings = hearingRepository.findAll();
        var consultations = consultationRepository.findAll();
        var payments = paymentRepository.findAll();
        var poas = poaRepository.findAll();
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime startToday = now.toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime endToday = startToday.plusDays(1);
        OffsetDateTime in7Days = now.plusDays(7);
        BigDecimal totalPendingPayments = payments.stream()
                .filter(payment -> "pending".equals(payment.getStatus()) || "overdue".equals(payment.getStatus()))
                .map(payment -> payment.getAmount() == null ? BigDecimal.ZERO : payment.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new DashboardSummaryResponse(
                cases.stream().filter(c -> "active".equals(c.getStatus()) || "upcoming_hearing".equals(c.getStatus())).count(),
                clientRepository.count(),
                tasks.stream().filter(t -> "new".equals(t.getStatus()) || "in_progress".equals(t.getStatus())).count(),
                tasks.stream().filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(now) && !"done".equals(t.getStatus()) && !"cancelled".equals(t.getStatus())).count(),
                hearings.stream().filter(h -> !h.getDatetime().isBefore(startToday) && h.getDatetime().isBefore(endToday)).count(),
                hearings.stream().filter(h -> !h.getDatetime().isBefore(now) && !h.getDatetime().isAfter(in7Days)).count(),
                consultations.stream().filter(c -> "pending".equals(c.getStatus()) || "under_review".equals(c.getStatus())).count(),
                totalPendingPayments,
                poas.stream().filter(p -> "with_lawyer".equals(p.getStatus())).count(),
                poas.stream().filter(p -> "overdue".equals(p.getStatus()) || (p.getReturnBy() != null && p.getReturnBy().isBefore(now) && !"returned".equals(p.getStatus()))).count(),
                cases.stream().collect(java.util.stream.Collectors.groupingBy(c -> c.getStatus(), java.util.stream.Collectors.counting())).entrySet().stream().map(e -> new CountByLabelResponse(e.getKey(), e.getValue())).toList(),
                cases.stream().collect(java.util.stream.Collectors.groupingBy(c -> c.getType(), java.util.stream.Collectors.counting())).entrySet().stream().map(e -> new CountByLabelResponse(e.getKey(), e.getValue())).toList(),
                tasks.stream().filter(t -> t.getAssignedTo() != null).collect(java.util.stream.Collectors.groupingBy(t -> referenceLookupService.userNames().get(t.getAssignedTo()), java.util.stream.Collectors.counting())).entrySet().stream().map(e -> new CountByLabelResponse(e.getKey(), e.getValue())).toList()
        );
    }
    public List<HearingResponse> upcomingHearings() { return hearingApplicationService.list(null, null, null, true); }
    public List<TaskResponse> overdueTasks() { return taskApplicationService.list(null, null, null, null).stream().filter(t -> t.dueDate() != null && t.dueDate().isBefore(OffsetDateTime.now()) && !"done".equals(t.status()) && !"cancelled".equals(t.status())).toList(); }
    public List<ActivityItemResponse> recentActivity() {
        return auditLogRepository.findTop20ByOrderByCreatedAtAsc()
                .stream()
                .map(activity -> new ActivityItemResponse(
                        activity.getId(),
                        activity.getAction(),
                        "%s %s".formatted(activity.getAction(), activity.getEntity()),
                        activity.getNewVal(),
                        activity.getUserId() == null ? null : referenceLookupService.userNames().get(activity.getUserId()),
                        activity.getEntity(),
                        activity.getEntityId(),
                        activity.getCreatedAt()
                ))
                .toList();
    }
    public List<PaymentResponse> recentPayments() { return paymentApplicationService.list(null, null, null); }
}
