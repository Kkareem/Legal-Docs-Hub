package com.legaldesk.modules.payments.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.payments.api.DebtorItemResponse;
import com.legaldesk.modules.payments.api.PaymentResponse;
import com.legaldesk.modules.payments.api.PaymentSummaryResponse;
import com.legaldesk.modules.payments.api.PaymentUpsertRequest;
import com.legaldesk.modules.payments.domain.PaymentEntity;
import com.legaldesk.modules.payments.infrastructure.PaymentEntityRepository;
import com.legaldesk.shared.support.ReferenceLookupService;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PaymentApplicationService {
    private final PaymentEntityRepository repository;
    private final ReferenceLookupService referenceLookupService;
    public PaymentApplicationService(PaymentEntityRepository repository, ReferenceLookupService referenceLookupService) {
        this.repository = repository;
        this.referenceLookupService = referenceLookupService;
    }
    @Transactional(readOnly = true)
    public List<PaymentResponse> list(Long clientId, Long caseId, String status) {
        return enrich(repository.findAllByOrderByCreatedAtAsc()).stream()
                .filter(p -> clientId == null || clientId.equals(p.clientId()))
                .filter(p -> caseId == null || caseId.equals(p.caseId()))
                .filter(p -> status == null || status.equals(p.status()))
                .toList();
    }
    @Transactional(readOnly = true)
    public PaymentResponse get(Long id) { return enrichOne(findEntity(id)); }
    public PaymentResponse create(PaymentUpsertRequest request) { PaymentEntity entity = new PaymentEntity(); apply(entity, request, true); return enrichOne(repository.save(entity)); }
    public PaymentResponse update(Long id, PaymentUpsertRequest request) { PaymentEntity entity = findEntity(id); apply(entity, request, false); return enrichOne(repository.save(entity)); }
    public void delete(Long id) { repository.delete(findEntity(id)); }
    @Transactional(readOnly = true)
    public PaymentSummaryResponse summary() {
        List<PaymentResponse> payments = enrich(repository.findAllByOrderByCreatedAtAsc());
        BigDecimal totalCollected = sumByStatus(payments, "paid");
        BigDecimal totalPending = sumByStatus(payments, "pending");
        BigDecimal totalOverdue = sumByStatus(payments, "overdue");
        List<PaymentResponse> recent = payments.stream().sorted(Comparator.comparing(PaymentResponse::createdAt).reversed()).limit(5).toList();
        List<DebtorItemResponse> debtors = payments.stream()
                .filter(payment -> "pending".equals(payment.status()) || "overdue".equals(payment.status()))
                .collect(Collectors.groupingBy(PaymentResponse::clientId, Collectors.reducing(BigDecimal.ZERO, PaymentResponse::amount, BigDecimal::add)))
                .entrySet().stream()
                .map(entry -> new DebtorItemResponse(entry.getKey(), payments.stream().filter(p -> entry.getKey().equals(p.clientId())).findFirst().map(PaymentResponse::clientName).orElse(null), entry.getValue()))
                .sorted(Comparator.comparing(DebtorItemResponse::amountDue).reversed())
                .limit(5)
                .toList();
        return new PaymentSummaryResponse(totalCollected, totalPending, totalOverdue, recent, debtors);
    }
    private BigDecimal sumByStatus(List<PaymentResponse> payments, String status) {
        return payments.stream().filter(payment -> status.equals(payment.status())).map(PaymentResponse::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    private PaymentEntity findEntity(Long id) { return repository.findById(id).orElseThrow(() -> new NotFoundException("Payment not found")); }
    private void apply(PaymentEntity entity, PaymentUpsertRequest request, boolean creating) {
        if (creating || request.clientId() != null) entity.setClientId(request.clientId());
        if (creating || request.caseId() != null) entity.setCaseId(request.caseId());
        if (creating || request.consultationId() != null) entity.setConsultationId(request.consultationId());
        if (creating || request.amount() != null) entity.setAmount(request.amount());
        if (creating || request.type() != null) entity.setType(request.type() != null ? request.type() : "case_fee");
        if (creating || request.status() != null) entity.setStatus(request.status() != null ? request.status() : "pending");
        if (creating || request.paidAt() != null) entity.setPaidAt(request.paidAt());
        if (creating || request.notes() != null) entity.setNotes(request.notes());
    }
    private List<PaymentResponse> enrich(List<PaymentEntity> entities) {
        Map<Long, String> clientNames = referenceLookupService.clientNames();
        Map<Long, String> caseNumbers = referenceLookupService.caseNumbers();
        return entities.stream().map(entity -> new PaymentResponse(entity.getId(), entity.getClientId(), clientNames.get(entity.getClientId()),
                entity.getCaseId(), entity.getCaseId() == null ? null : caseNumbers.get(entity.getCaseId()), entity.getConsultationId(),
                entity.getAmount(), entity.getType(), entity.getStatus(), entity.getPaidAt(), entity.getNotes(), entity.getCreatedAt())).toList();
    }
    private PaymentResponse enrichOne(PaymentEntity entity) { return enrich(List.of(entity)).getFirst(); }
}
