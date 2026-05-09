package com.legaldesk.modules.poa.domain;

import com.legaldesk.common.jpa.CreatedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "powers_of_attorney")
public class PowerOfAttorneyEntity extends CreatedEntity {

    @Column(name = "client_id", nullable = false)
    private Long clientId;
    @Column(name = "case_id")
    private Long caseId;
    @Column(name = "received_by", nullable = false)
    private Long receivedBy;
    @Column(name = "handed_by")
    private String handedBy;
    @Column(name = "received_at", nullable = false)
    private OffsetDateTime receivedAt;
    @Column(name = "return_by")
    private OffsetDateTime returnBy;
    @Column(name = "returned_at")
    private OffsetDateTime returnedAt;
    @Column(nullable = false)
    private String status = "in_office";
    private String notes;

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getReceivedBy() { return receivedBy; }
    public void setReceivedBy(Long receivedBy) { this.receivedBy = receivedBy; }
    public String getHandedBy() { return handedBy; }
    public void setHandedBy(String handedBy) { this.handedBy = handedBy; }
    public OffsetDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(OffsetDateTime receivedAt) { this.receivedAt = receivedAt; }
    public OffsetDateTime getReturnBy() { return returnBy; }
    public void setReturnBy(OffsetDateTime returnBy) { this.returnBy = returnBy; }
    public OffsetDateTime getReturnedAt() { return returnedAt; }
    public void setReturnedAt(OffsetDateTime returnedAt) { this.returnedAt = returnedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
