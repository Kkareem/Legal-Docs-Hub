package com.legaldesk.modules.cases.infrastructure;

import com.legaldesk.modules.cases.domain.CaseEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CaseEntityRepository extends JpaRepository<CaseEntity, Long> {
    List<CaseEntity> findAllByOrderByCreatedAtAsc();
    List<CaseEntity> findByClientId(Long clientId);
}
