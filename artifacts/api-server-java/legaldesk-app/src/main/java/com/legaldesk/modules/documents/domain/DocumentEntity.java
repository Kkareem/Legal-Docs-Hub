package com.legaldesk.modules.documents.domain;

import com.legaldesk.common.jpa.CreatedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "documents")
public class DocumentEntity extends CreatedEntity {

    @Column(name = "case_id")
    private Long caseId;
    @Column(name = "client_id")
    private Long clientId;
    @Column(name = "file_url", nullable = false)
    private String fileUrl;
    @Column(name = "file_name", nullable = false)
    private String fileName;
    @Column(name = "doc_type", nullable = false)
    private String docType = "other";
    @Column(name = "is_original", nullable = false)
    private boolean isOriginal;
    @Column(name = "uploaded_by")
    private Long uploadedBy;
    private String notes;

    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getDocType() { return docType; }
    public void setDocType(String docType) { this.docType = docType; }
    public boolean isOriginal() { return isOriginal; }
    public void setOriginal(boolean original) { isOriginal = original; }
    public Long getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(Long uploadedBy) { this.uploadedBy = uploadedBy; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
