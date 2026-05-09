package com.legaldesk.modules.cases.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.cases.api.CaseResponse;
import com.legaldesk.modules.cases.api.CreateCaseRequest;
import com.legaldesk.modules.cases.api.UpdateCaseRequest;
import com.legaldesk.modules.cases.domain.CaseEntity;
import com.legaldesk.modules.cases.infrastructure.CaseEntityRepository;
import com.legaldesk.shared.support.ReferenceLookupService;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CaseApplicationService {

    private final CaseEntityRepository repository;
    private final ReferenceLookupService referenceLookupService;

    public CaseApplicationService(CaseEntityRepository repository, ReferenceLookupService referenceLookupService) {
        this.repository = repository;
        this.referenceLookupService = referenceLookupService;
    }

    @Transactional(readOnly = true)
    public List<CaseResponse> list(String status, String type, Long lawyerId, Long clientId, String search) {
        return enrich(repository.findAllByOrderByCreatedAtAsc()).stream()
                .filter(c -> status == null || status.equals(c.status()))
                .filter(c -> type == null || type.equals(c.type()))
                .filter(c -> lawyerId == null || lawyerId.equals(c.leadLawyerId()))
                .filter(c -> clientId == null || clientId.equals(c.clientId()))
                .filter(c -> search == null || search.isBlank()
                        || c.caseNumber().toLowerCase().contains(search.toLowerCase())
                        || (c.court() != null && c.court().toLowerCase().contains(search.toLowerCase())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CaseResponse get(Long id) {
        return enrichOne(findEntity(id));
    }

    public CaseResponse create(CreateCaseRequest request) {
        CaseEntity entity = new CaseEntity();
        apply(entity, request.caseNumber(), request.courtCaseNumber(), request.type(), request.court(),
                request.division(), request.clientId(), request.leadLawyerId(), request.status(),
                request.opposingParty(), request.description());
        return enrichOne(repository.save(entity));
    }

    public CaseResponse update(Long id, UpdateCaseRequest request) {
        CaseEntity entity = findEntity(id);
        apply(entity,
                request.caseNumber() != null ? request.caseNumber() : entity.getCaseNumber(),
                request.courtCaseNumber() != null ? request.courtCaseNumber() : entity.getCourtCaseNumber(),
                request.type() != null ? request.type() : entity.getType(),
                request.court() != null ? request.court() : entity.getCourt(),
                request.division() != null ? request.division() : entity.getDivision(),
                request.clientId() != null ? request.clientId() : entity.getClientId(),
                request.leadLawyerId() != null ? request.leadLawyerId() : entity.getLeadLawyerId(),
                request.status() != null ? request.status() : entity.getStatus(),
                request.opposingParty() != null ? request.opposingParty() : entity.getOpposingParty(),
                request.description() != null ? request.description() : entity.getDescription());
        return enrichOne(repository.save(entity));
    }

    public void delete(Long id) {
        repository.delete(findEntity(id));
    }

    private CaseEntity findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Case not found"));
    }

    private List<CaseResponse> enrich(List<CaseEntity> entities) {
        Map<Long, String> clientNames = referenceLookupService.clientNames();
        Map<Long, String> userNames = referenceLookupService.userNames();
        return entities.stream().map(entity -> toResponse(entity, clientNames, userNames)).toList();
    }

    private CaseResponse enrichOne(CaseEntity entity) {
        return toResponse(entity, referenceLookupService.clientNames(), referenceLookupService.userNames());
    }

    private CaseResponse toResponse(CaseEntity entity, Map<Long, String> clientNames, Map<Long, String> userNames) {
        return new CaseResponse(
                entity.getId(), entity.getCaseNumber(), entity.getCourtCaseNumber(), entity.getType(), entity.getCourt(),
                entity.getDivision(), entity.getClientId(), clientNames.get(entity.getClientId()),
                entity.getLeadLawyerId(), entity.getLeadLawyerId() == null ? null : userNames.get(entity.getLeadLawyerId()),
                entity.getStatus(), entity.getOpposingParty(), entity.getDescription(), entity.getOfficeId(),
                entity.getCreatedAt(), entity.getUpdatedAt()
        );
    }

    private void apply(CaseEntity entity, String caseNumber, String courtCaseNumber, String type, String court,
                       String division, Long clientId, Long leadLawyerId, String status, String opposingParty, String description) {
        entity.setCaseNumber(caseNumber);
        entity.setCourtCaseNumber(courtCaseNumber);
        entity.setType(type != null ? type : "civil");
        entity.setCourt(court);
        entity.setDivision(division);
        entity.setClientId(clientId);
        entity.setLeadLawyerId(leadLawyerId);
        entity.setStatus(status != null ? status : "new");
        entity.setOpposingParty(opposingParty);
        entity.setDescription(description);
    }
}
