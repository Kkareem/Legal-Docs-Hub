package com.legaldesk.modules.documents.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.documents.api.DocumentResponse;
import com.legaldesk.modules.documents.api.DocumentUpsertRequest;
import com.legaldesk.modules.documents.domain.DocumentEntity;
import com.legaldesk.modules.documents.infrastructure.DocumentEntityRepository;
import com.legaldesk.shared.support.ReferenceLookupService;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DocumentApplicationService {
    private final DocumentEntityRepository repository;
    private final ReferenceLookupService referenceLookupService;
    public DocumentApplicationService(DocumentEntityRepository repository, ReferenceLookupService referenceLookupService) {
        this.repository = repository;
        this.referenceLookupService = referenceLookupService;
    }
    @Transactional(readOnly = true)
    public List<DocumentResponse> list(Long caseId, Long clientId, String docType) {
        return enrich(repository.findAllByOrderByCreatedAtAsc()).stream()
                .filter(d -> caseId == null || caseId.equals(d.caseId()))
                .filter(d -> clientId == null || clientId.equals(d.clientId()))
                .filter(d -> docType == null || docType.equals(d.docType()))
                .toList();
    }
    @Transactional(readOnly = true)
    public DocumentResponse get(Long id) { return enrichOne(findEntity(id)); }
    public DocumentResponse create(DocumentUpsertRequest request) {
        DocumentEntity entity = new DocumentEntity();
        apply(entity, request, true);
        return enrichOne(repository.save(entity));
    }
    public DocumentResponse update(Long id, DocumentUpsertRequest request) {
        DocumentEntity entity = findEntity(id);
        apply(entity, request, false);
        return enrichOne(repository.save(entity));
    }
    public void delete(Long id) { repository.delete(findEntity(id)); }
    private void apply(DocumentEntity entity, DocumentUpsertRequest request, boolean creating) {
        if (creating || request.caseId() != null) entity.setCaseId(request.caseId());
        if (creating || request.clientId() != null) entity.setClientId(request.clientId());
        if (creating || request.fileUrl() != null) entity.setFileUrl(request.fileUrl());
        if (creating || request.fileName() != null) entity.setFileName(request.fileName());
        if (creating || request.docType() != null) entity.setDocType(request.docType() != null ? request.docType() : "other");
        if (creating || request.isOriginal() != null) entity.setOriginal(Boolean.TRUE.equals(request.isOriginal()));
        if (creating || request.uploadedBy() != null) entity.setUploadedBy(request.uploadedBy());
        if (creating || request.notes() != null) entity.setNotes(request.notes());
    }
    private DocumentEntity findEntity(Long id) { return repository.findById(id).orElseThrow(() -> new NotFoundException("Document not found")); }
    private List<DocumentResponse> enrich(List<DocumentEntity> entities) {
        Map<Long, String> userNames = referenceLookupService.userNames();
        return entities.stream().map(entity -> new DocumentResponse(entity.getId(), entity.getCaseId(), entity.getClientId(),
                entity.getFileUrl(), entity.getFileName(), entity.getDocType(), entity.isOriginal(),
                entity.getUploadedBy(), entity.getUploadedBy() == null ? null : userNames.get(entity.getUploadedBy()),
                entity.getNotes(), entity.getCreatedAt())).toList();
    }
    private DocumentResponse enrichOne(DocumentEntity entity) { return enrich(List.of(entity)).getFirst(); }
}
