package com.legaldesk.modules.cases.domain;

import com.legaldesk.common.jpa.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "cases")
public class CaseEntity extends AuditedEntity {

    @Column(name = "case_number", nullable = false)
    private String caseNumber;
    @Column(name = "court_case_number")
    private String courtCaseNumber;
    @Column(nullable = false)
    private String type = "civil";
    private String court;
    private String division;
    @Column(name = "client_id", nullable = false)
    private Long clientId;
    @Column(name = "lead_lawyer_id")
    private Long leadLawyerId;
    @Column(nullable = false)
    private String status = "new";
    @Column(name = "opposing_party")
    private String opposingParty;
    private String description;
    @Column(name = "office_id")
    private Long officeId;

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
    public String getCourtCaseNumber() { return courtCaseNumber; }
    public void setCourtCaseNumber(String courtCaseNumber) { this.courtCaseNumber = courtCaseNumber; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCourt() { return court; }
    public void setCourt(String court) { this.court = court; }
    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }
    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }
    public Long getLeadLawyerId() { return leadLawyerId; }
    public void setLeadLawyerId(Long leadLawyerId) { this.leadLawyerId = leadLawyerId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOpposingParty() { return opposingParty; }
    public void setOpposingParty(String opposingParty) { this.opposingParty = opposingParty; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getOfficeId() { return officeId; }
    public void setOfficeId(Long officeId) { this.officeId = officeId; }
}
