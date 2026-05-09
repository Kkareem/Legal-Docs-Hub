package com.legaldesk.modules.hearings.infrastructure;

import com.legaldesk.modules.hearings.domain.HearingEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HearingEntityRepository extends JpaRepository<HearingEntity, Long> {
    List<HearingEntity> findAllByOrderByDatetimeAsc();
    List<HearingEntity> findByCaseId(Long caseId);
}
