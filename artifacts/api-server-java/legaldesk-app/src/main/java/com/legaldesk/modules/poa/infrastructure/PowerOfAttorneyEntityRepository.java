package com.legaldesk.modules.poa.infrastructure;

import com.legaldesk.modules.poa.domain.PowerOfAttorneyEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PowerOfAttorneyEntityRepository extends JpaRepository<PowerOfAttorneyEntity, Long> {
    List<PowerOfAttorneyEntity> findAllByOrderByCreatedAtAsc();
}
