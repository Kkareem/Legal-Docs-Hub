package com.legaldesk.modules.tasks.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.tasks.api.TaskResponse;
import com.legaldesk.modules.tasks.api.TaskUpsertRequest;
import com.legaldesk.modules.tasks.domain.TaskEntity;
import com.legaldesk.modules.tasks.infrastructure.TaskEntityRepository;
import com.legaldesk.shared.support.ReferenceLookupService;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TaskApplicationService {
    private final TaskEntityRepository repository;
    private final ReferenceLookupService referenceLookupService;

    public TaskApplicationService(TaskEntityRepository repository, ReferenceLookupService referenceLookupService) {
        this.repository = repository;
        this.referenceLookupService = referenceLookupService;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> list(String status, Long assignedTo, Long caseId, String priority) {
        return enrich(repository.findAllByOrderByCreatedAtAsc()).stream()
                .filter(t -> status == null || status.equals(t.status()))
                .filter(t -> assignedTo == null || assignedTo.equals(t.assignedTo()))
                .filter(t -> caseId == null || caseId.equals(t.caseId()))
                .filter(t -> priority == null || priority.equals(t.priority()))
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse get(Long id) { return enrichOne(findEntity(id)); }

    public TaskResponse create(TaskUpsertRequest request) {
        TaskEntity entity = new TaskEntity();
        apply(entity, request, true);
        return enrichOne(repository.save(entity));
    }

    public TaskResponse update(Long id, TaskUpsertRequest request) {
        TaskEntity entity = findEntity(id);
        apply(entity, request, false);
        return enrichOne(repository.save(entity));
    }

    public void delete(Long id) { repository.delete(findEntity(id)); }

    private TaskEntity findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Task not found"));
    }

    private void apply(TaskEntity entity, TaskUpsertRequest request, boolean creating) {
        if (creating || request.title() != null) entity.setTitle(request.title());
        if (creating || request.description() != null) entity.setDescription(request.description());
        if (creating || request.caseId() != null) entity.setCaseId(request.caseId());
        if (creating || request.assignedTo() != null) entity.setAssignedTo(request.assignedTo());
        if (creating || request.dueDate() != null) entity.setDueDate(request.dueDate());
        if (creating || request.priority() != null) entity.setPriority(request.priority() != null ? request.priority() : "medium");
        if (creating || request.status() != null) entity.setStatus(request.status() != null ? request.status() : "new");
    }

    private List<TaskResponse> enrich(List<TaskEntity> entities) {
        Map<Long, String> caseNumbers = referenceLookupService.caseNumbers();
        Map<Long, String> userNames = referenceLookupService.userNames();
        return entities.stream().map(entity -> toResponse(entity, caseNumbers, userNames)).toList();
    }

    private TaskResponse enrichOne(TaskEntity entity) {
        return toResponse(entity, referenceLookupService.caseNumbers(), referenceLookupService.userNames());
    }

    private TaskResponse toResponse(TaskEntity entity, Map<Long, String> caseNumbers, Map<Long, String> userNames) {
        return new TaskResponse(entity.getId(), entity.getTitle(), entity.getDescription(), entity.getCaseId(),
                entity.getCaseId() == null ? null : caseNumbers.get(entity.getCaseId()),
                entity.getAssignedTo(), entity.getAssignedTo() == null ? null : userNames.get(entity.getAssignedTo()),
                entity.getDueDate(), entity.getPriority(), entity.getStatus(), entity.getOfficeId(),
                entity.getCreatedAt(), entity.getUpdatedAt());
    }
}
