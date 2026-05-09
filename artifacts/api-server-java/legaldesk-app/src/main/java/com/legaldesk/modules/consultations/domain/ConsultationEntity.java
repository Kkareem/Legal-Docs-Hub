package com.legaldesk.modules.consultations.domain;

import com.legaldesk.common.jpa.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "consultations")
public class ConsultationEntity extends AuditedEntity {

    @Column(name = "client_id", nullable = false)
    private Long clientId;
    @Column(nullable = false)
    private String summary;
    @Column(name = "payment_status", nullable = false)
    private String paymentStatus = "pending";
    private BigDecimal fee;
    @Column(nullable = false)
    private String status = "pending";
    @Column(name = "assigned_to")
    private Long assignedTo;
    private String response;

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public BigDecimal getFee() { return fee; }
    public void setFee(BigDecimal fee) { this.fee = fee; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Long assignedTo) { this.assignedTo = assignedTo; }
    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
}
