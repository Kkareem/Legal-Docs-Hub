package com.legaldesk.modules.audit.infrastructure;

import com.legaldesk.modules.audit.domain.AuditLogEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogEntityRepository extends JpaRepository<AuditLogEntity, Long> {
    List<AuditLogEntity> findTop20ByOrderByCreatedAtAsc();
}
