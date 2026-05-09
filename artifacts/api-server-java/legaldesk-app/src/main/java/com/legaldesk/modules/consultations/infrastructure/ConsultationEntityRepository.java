package com.legaldesk.modules.consultations.infrastructure;

import com.legaldesk.modules.consultations.domain.ConsultationEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultationEntityRepository extends JpaRepository<ConsultationEntity, Long> {
    List<ConsultationEntity> findAllByOrderByCreatedAtAsc();
}
