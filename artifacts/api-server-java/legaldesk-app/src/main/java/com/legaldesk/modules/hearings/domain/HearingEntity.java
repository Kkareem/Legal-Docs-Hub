package com.legaldesk.modules.hearings.domain;

import com.legaldesk.common.jpa.CreatedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "hearings")
public class HearingEntity extends CreatedEntity {

    @Column(name = "case_id", nullable = false)
    private Long caseId;
    @Column(nullable = false)
    private OffsetDateTime datetime;
    private String court;
    @Column(nullable = false)
    private String type = "session";
    @Column(name = "assigned_lawyer")
    private Long assignedLawyer;
    @Column(nullable = false)
    private String status = "scheduled";
    private String notes;

    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public OffsetDateTime getDatetime() { return datetime; }
    public void setDatetime(OffsetDateTime datetime) { this.datetime = datetime; }
    public String getCourt() { return court; }
    public void setCourt(String court) { this.court = court; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getAssignedLawyer() { return assignedLawyer; }
    public void setAssignedLawyer(Long assignedLawyer) { this.assignedLawyer = assignedLawyer; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
