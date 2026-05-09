package com.legaldesk.modules.documents.infrastructure;

import com.legaldesk.modules.documents.domain.DocumentEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentEntityRepository extends JpaRepository<DocumentEntity, Long> {
    List<DocumentEntity> findAllByOrderByCreatedAtAsc();
    List<DocumentEntity> findByCaseId(Long caseId);
    List<DocumentEntity> findByClientId(Long clientId);
}
