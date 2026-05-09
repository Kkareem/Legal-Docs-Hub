package com.legaldesk.modules.hearings.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.hearings.api.HearingResponse;
import com.legaldesk.modules.hearings.api.HearingUpsertRequest;
import com.legaldesk.modules.hearings.domain.HearingEntity;
import com.legaldesk.modules.hearings.infrastructure.HearingEntityRepository;
import com.legaldesk.shared.support.ReferenceLookupService;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class HearingApplicationService {
    private final HearingEntityRepository repository;
    private final ReferenceLookupService referenceLookupService;
    public HearingApplicationService(HearingEntityRepository repository, ReferenceLookupService referenceLookupService) {
        this.repository = repository;
        this.referenceLookupService = referenceLookupService;
    }
    @Transactional(readOnly = true)
    public List<HearingResponse> list(Long caseId, Long assignedLawyer, String status, Boolean upcoming) {
        OffsetDateTime now = OffsetDateTime.now();
        return enrich(repository.findAllByOrderByDatetimeAsc()).stream()
                .filter(h -> caseId == null || caseId.equals(h.caseId()))
                .filter(h -> assignedLawyer == null || assignedLawyer.equals(h.assignedLawyer()))
                .filter(h -> status == null || status.equals(h.status()))
                .filter(h -> upcoming == null || !upcoming || !h.datetime().isBefore(now))
                .toList();
    }
    @Transactional(readOnly = true)
    public HearingResponse get(Long id) { return enrichOne(findEntity(id)); }
    public HearingResponse create(HearingUpsertRequest request) {
        HearingEntity entity = new HearingEntity();
        apply(entity, request, true);
        return enrichOne(repository.save(entity));
    }
    public HearingResponse update(Long id, HearingUpsertRequest request) {
        HearingEntity entity = findEntity(id);
        apply(entity, request, false);
        return enrichOne(repository.save(entity));
    }
    public void delete(Long id) { repository.delete(findEntity(id)); }
    private HearingEntity findEntity(Long id) { return repository.findById(id).orElseThrow(() -> new NotFoundException("Hearing not found")); }
    private void apply(HearingEntity entity, HearingUpsertRequest request, boolean creating) {
        if (creating || request.caseId() != null) entity.setCaseId(request.caseId());
        if (creating || request.datetime() != null) entity.setDatetime(request.datetime());
        if (creating || request.court() != null) entity.setCourt(request.court());
        if (creating || request.type() != null) entity.setType(request.type() != null ? request.type() : "session");
        if (creating || request.assignedLawyer() != null) entity.setAssignedLawyer(request.assignedLawyer());
        if (creating || request.status() != null) entity.setStatus(request.status() != null ? request.status() : "scheduled");
        if (creating || request.notes() != null) entity.setNotes(request.notes());
    }
    private List<HearingResponse> enrich(List<HearingEntity> entities) {
        Map<Long, String> caseNumbers = referenceLookupService.caseNumbers();
        Map<Long, String> userNames = referenceLookupService.userNames();
        return entities.stream().map(entity -> new HearingResponse(entity.getId(), entity.getCaseId(),
                caseNumbers.get(entity.getCaseId()), entity.getDatetime(), entity.getCourt(), entity.getType(),
                entity.getAssignedLawyer(), entity.getAssignedLawyer() == null ? null : userNames.get(entity.getAssignedLawyer()),
                entity.getStatus(), entity.getNotes(), entity.getCreatedAt())).toList();
    }
    private HearingResponse enrichOne(HearingEntity entity) { return enrich(List.of(entity)).getFirst(); }
}
