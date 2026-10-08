package com.legaldesk.modules.documents.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.common.domain.BusinessRuleViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final com.legaldesk.modules.cases.application.CaseAccessService caseAccess;
    private final DocumentEntityRepository repository;
    private final JdbcTemplate jdbc;
    private final ReferenceLookupService referenceLookupService;
    public DocumentApplicationService(DocumentEntityRepository repository, ReferenceLookupService referenceLookupService, JdbcTemplate jdbc, com.legaldesk.modules.cases.application.CaseAccessService caseAccess) {
        this.repository = repository;
        this.caseAccess = caseAccess;
        this.jdbc = jdbc;
        this.referenceLookupService = referenceLookupService;
    }
    @Transactional(readOnly = true)
    public List<DocumentResponse> list(Long caseId, Long clientId, String docType) {
        return enrich(repository.findAllByOrderByCreatedAtAsc()).stream().filter(x -> x.caseId()==null || caseAccess.allowed(x.caseId()))
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
        checkMetadataOnly(id);
        DocumentEntity entity = findEntity(id);
        apply(entity, request, false);
        return enrichOne(repository.save(entity));
    }
    public void delete(Long id) { checkMetadataOnly(id); repository.delete(findEntity(id)); }
    private void checkMetadataOnly(Long id) {
        if (jdbc.queryForObject("SELECT COUNT(*) FROM documents WHERE id=? AND content IS NOT NULL", Long.class, id)>0)
            throw new BusinessRuleViolationException("Stored attachments cannot be changed through metadata operations");
    }
    private void apply(DocumentEntity entity, DocumentUpsertRequest request, boolean creating) {
        if(request.caseId()!=null)caseAccess.require(request.caseId());
        if(entity.getCaseId()!=null)caseAccess.require(entity.getCaseId());
        if (creating || request.caseId() != null) entity.setCaseId(request.caseId());
        if (creating || request.clientId() != null) entity.setClientId(request.clientId());
        if (creating || request.fileUrl() != null) entity.setFileUrl(request.fileUrl());
        if (creating || request.fileName() != null) entity.setFileName(request.fileName());
        if (creating || request.docType() != null) entity.setDocType(request.docType() != null ? request.docType() : "other");
        if (creating || request.isOriginal() != null) entity.setOriginal(Boolean.TRUE.equals(request.isOriginal()));
        if (creating || request.uploadedBy() != null) entity.setUploadedBy(request.uploadedBy());
        if (creating || request.notes() != null) entity.setNotes(request.notes());
    }
    private DocumentEntity findEntity(Long id) { DocumentEntity entity=repository.findById(id).orElseThrow(() -> new NotFoundException("Document not found")); if(entity.getCaseId()!=null)caseAccess.require(entity.getCaseId()); return entity; }
    private List<DocumentResponse> enrich(List<DocumentEntity> entities) {
        Map<Long, String> userNames = referenceLookupService.userNames();
        return entities.stream().map(entity -> new DocumentResponse(entity.getId(), entity.getCaseId(), entity.getClientId(),
                entity.getFileUrl(), entity.getFileName(), entity.getDocType(), entity.isOriginal(),
                entity.getUploadedBy(), entity.getUploadedBy() == null ? null : userNames.get(entity.getUploadedBy()),
                entity.getNotes(), entity.getCreatedAt())).toList();
    }
    private DocumentResponse enrichOne(DocumentEntity entity) { return enrich(List.of(entity)).getFirst(); }
}
