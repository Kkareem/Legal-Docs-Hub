package com.legaldesk.modules.clients.domain;

import com.legaldesk.common.jpa.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "clients")
public class ClientEntity extends AuditedEntity {

    @Column(nullable = false)
    private String name;
    private String phone;
    private String email;
    @Column(name = "national_id")
    private String nationalId;
    private String address;
    @Column(name = "office_id")
    private Long officeId;
    @Column(nullable = false)
    private String status = "new";
    @Column(name = "service_type")
    private String serviceType;
    private String notes;
    @Column(name = "user_id")
    private Long userId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getNationalId() { return nationalId; }
    public void setNationalId(String nationalId) { this.nationalId = nationalId; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Long getOfficeId() { return officeId; }
    public void setOfficeId(Long officeId) { this.officeId = officeId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
