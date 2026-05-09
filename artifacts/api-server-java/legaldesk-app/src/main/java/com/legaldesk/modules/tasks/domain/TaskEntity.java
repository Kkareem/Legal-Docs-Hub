package com.legaldesk.modules.tasks.domain;

import com.legaldesk.common.jpa.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tasks")
public class TaskEntity extends AuditedEntity {

    @Column(nullable = false)
    private String title;
    private String description;
    @Column(name = "case_id")
    private Long caseId;
    @Column(name = "assigned_to")
    private Long assignedTo;
    @Column(name = "due_date")
    private OffsetDateTime dueDate;
    @Column(nullable = false)
    private String priority = "medium";
    @Column(nullable = false)
    private String status = "new";
    @Column(name = "office_id")
    private Long officeId;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Long assignedTo) { this.assignedTo = assignedTo; }
    public OffsetDateTime getDueDate() { return dueDate; }
    public void setDueDate(OffsetDateTime dueDate) { this.dueDate = dueDate; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getOfficeId() { return officeId; }
    public void setOfficeId(Long officeId) { this.officeId = officeId; }
}
