package com.legaldesk.modules.poa.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.poa.api.PowerOfAttorneyResponse;
import com.legaldesk.modules.poa.api.PowerOfAttorneyUpsertRequest;
import com.legaldesk.modules.poa.domain.PowerOfAttorneyEntity;
import com.legaldesk.modules.poa.infrastructure.PowerOfAttorneyEntityRepository;
import com.legaldesk.shared.support.ReferenceLookupService;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PowerOfAttorneyApplicationService {
    private final com.legaldesk.modules.cases.application.CaseAccessService caseAccess;
    private final PowerOfAttorneyEntityRepository repository;
    private final ReferenceLookupService referenceLookupService;
    public PowerOfAttorneyApplicationService(PowerOfAttorneyEntityRepository repository, ReferenceLookupService referenceLookupService, com.legaldesk.modules.cases.application.CaseAccessService caseAccess) {
        this.repository = repository;
        this.caseAccess = caseAccess;
        this.referenceLookupService = referenceLookupService;
    }
    @Transactional(readOnly = true)
    public List<PowerOfAttorneyResponse> list(String status, Long receivedBy) {
        return enrich(repository.findAllByOrderByCreatedAtAsc()).stream().filter(x -> x.caseId()==null || caseAccess.allowed(x.caseId()))
                .filter(p -> status == null || status.equals(p.status()))
                .filter(p -> receivedBy == null || receivedBy.equals(p.receivedBy()))
                .toList();
    }
    @Transactional(readOnly = true)
    public PowerOfAttorneyResponse get(Long id) { return enrichOne(findEntity(id)); }
    public PowerOfAttorneyResponse create(PowerOfAttorneyUpsertRequest request) { PowerOfAttorneyEntity entity = new PowerOfAttorneyEntity(); apply(entity, request, true); return enrichOne(repository.save(entity)); }
    public PowerOfAttorneyResponse update(Long id, PowerOfAttorneyUpsertRequest request) { PowerOfAttorneyEntity entity = findEntity(id); apply(entity, request, false); return enrichOne(repository.save(entity)); }
    public void delete(Long id) { repository.delete(findEntity(id)); }
    private PowerOfAttorneyEntity findEntity(Long id) { PowerOfAttorneyEntity entity=repository.findById(id).orElseThrow(() -> new NotFoundException("Power of attorney not found"));if(entity.getCaseId()!=null)caseAccess.require(entity.getCaseId());return entity; }
    private void apply(PowerOfAttorneyEntity entity, PowerOfAttorneyUpsertRequest request, boolean creating) {
        if (creating || request.clientId() != null) entity.setClientId(request.clientId());
        if(request.caseId()!=null)caseAccess.require(request.caseId());
        if(entity.getCaseId()!=null)caseAccess.require(entity.getCaseId());
        if (creating || request.caseId() != null) entity.setCaseId(request.caseId());
        if (creating || request.receivedBy() != null) entity.setReceivedBy(request.receivedBy());
        if (creating || request.handedBy() != null) entity.setHandedBy(request.handedBy());
        if (creating || request.receivedAt() != null) entity.setReceivedAt(request.receivedAt());
        if (creating || request.returnBy() != null) entity.setReturnBy(request.returnBy());
        if (creating || request.returnedAt() != null) entity.setReturnedAt(request.returnedAt());
        if (creating || request.status() != null) entity.setStatus(request.status() != null ? request.status() : "in_office");
        if (creating || request.notes() != null) entity.setNotes(request.notes());
    }
    private List<PowerOfAttorneyResponse> enrich(List<PowerOfAttorneyEntity> entities) {
        Map<Long, String> clientNames = referenceLookupService.clientNames();
        Map<Long, String> caseNumbers = referenceLookupService.caseNumbers();
        Map<Long, String> userNames = referenceLookupService.userNames();
        return entities.stream().map(entity -> new PowerOfAttorneyResponse(entity.getId(), entity.getClientId(), clientNames.get(entity.getClientId()),
                entity.getCaseId(), entity.getCaseId() == null ? null : caseNumbers.get(entity.getCaseId()),
                entity.getReceivedBy(), userNames.get(entity.getReceivedBy()), entity.getHandedBy(), entity.getReceivedAt(),
                entity.getReturnBy(), entity.getReturnedAt(), entity.getStatus(), entity.getNotes(), entity.getCreatedAt())).toList();
    }
    private PowerOfAttorneyResponse enrichOne(PowerOfAttorneyEntity entity) { return enrich(List.of(entity)).getFirst(); }
}
