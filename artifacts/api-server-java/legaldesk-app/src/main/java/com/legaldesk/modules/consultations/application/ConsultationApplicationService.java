package com.legaldesk.modules.consultations.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.consultations.api.ConsultationResponse;
import com.legaldesk.modules.consultations.api.ConsultationUpsertRequest;
import com.legaldesk.modules.consultations.domain.ConsultationEntity;
import com.legaldesk.modules.consultations.infrastructure.ConsultationEntityRepository;
import com.legaldesk.shared.support.ReferenceLookupService;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ConsultationApplicationService {
    private final ConsultationEntityRepository repository;
    private final ReferenceLookupService referenceLookupService;
    public ConsultationApplicationService(ConsultationEntityRepository repository, ReferenceLookupService referenceLookupService) {
        this.repository = repository;
        this.referenceLookupService = referenceLookupService;
    }
    @Transactional(readOnly = true)
    public List<ConsultationResponse> list(String status, Long clientId) {
        return enrich(repository.findAllByOrderByCreatedAtAsc()).stream()
                .filter(c -> status == null || status.equals(c.status()))
                .filter(c -> clientId == null || clientId.equals(c.clientId()))
                .toList();
    }
    @Transactional(readOnly = true)
    public ConsultationResponse get(Long id) { return enrichOne(findEntity(id)); }
    public ConsultationResponse create(ConsultationUpsertRequest request) { ConsultationEntity entity = new ConsultationEntity(); apply(entity, request, true); return enrichOne(repository.save(entity)); }
    public ConsultationResponse update(Long id, ConsultationUpsertRequest request) { ConsultationEntity entity = findEntity(id); apply(entity, request, false); return enrichOne(repository.save(entity)); }
    public void delete(Long id) { repository.delete(findEntity(id)); }
    private ConsultationEntity findEntity(Long id) { return repository.findById(id).orElseThrow(() -> new NotFoundException("Consultation not found")); }
    private void apply(ConsultationEntity entity, ConsultationUpsertRequest request, boolean creating) {
        if (creating || request.clientId() != null) entity.setClientId(request.clientId());
        if (creating || request.summary() != null) entity.setSummary(request.summary());
        if (creating || request.paymentStatus() != null) entity.setPaymentStatus(request.paymentStatus() != null ? request.paymentStatus() : "pending");
        if (creating || request.fee() != null) entity.setFee(request.fee());
        if (creating || request.status() != null) entity.setStatus(request.status() != null ? request.status() : "pending");
        if (creating || request.assignedTo() != null) entity.setAssignedTo(request.assignedTo());
        if (creating || request.response() != null) entity.setResponse(request.response());
    }
    private List<ConsultationResponse> enrich(List<ConsultationEntity> entities) {
        Map<Long, String> clientNames = referenceLookupService.clientNames();
        Map<Long, String> userNames = referenceLookupService.userNames();
        return entities.stream().map(entity -> new ConsultationResponse(entity.getId(), entity.getClientId(), clientNames.get(entity.getClientId()),
                entity.getSummary(), entity.getPaymentStatus(), entity.getFee(), entity.getStatus(), entity.getAssignedTo(),
                entity.getAssignedTo() == null ? null : userNames.get(entity.getAssignedTo()), entity.getResponse(),
                entity.getCreatedAt(), entity.getUpdatedAt())).toList();
    }
    private ConsultationResponse enrichOne(ConsultationEntity entity) { return enrich(List.of(entity)).getFirst(); }
}
