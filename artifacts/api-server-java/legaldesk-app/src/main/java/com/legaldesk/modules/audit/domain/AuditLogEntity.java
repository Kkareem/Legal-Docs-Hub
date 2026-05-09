package com.legaldesk.modules.audit.domain;

import com.legaldesk.common.jpa.CreatedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "audit_logs")
public class AuditLogEntity extends CreatedEntity {

    @Column(name = "user_id")
    private Long userId;
    @Column(nullable = false)
    private String action;
    @Column(nullable = false)
    private String entity;
    @Column(name = "entity_id")
    private Long entityId;
    @Column(name = "old_val")
    private String oldVal;
    @Column(name = "new_val")
    private String newVal;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public String getOldVal() { return oldVal; }
    public void setOldVal(String oldVal) { this.oldVal = oldVal; }
    public String getNewVal() { return newVal; }
    public void setNewVal(String newVal) { this.newVal = newVal; }
}
