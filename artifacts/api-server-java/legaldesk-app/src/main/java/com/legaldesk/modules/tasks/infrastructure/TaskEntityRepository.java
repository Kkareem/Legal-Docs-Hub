package com.legaldesk.modules.tasks.infrastructure;

import com.legaldesk.modules.tasks.domain.TaskEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskEntityRepository extends JpaRepository<TaskEntity, Long> {
    List<TaskEntity> findAllByOrderByCreatedAtAsc();
    List<TaskEntity> findByCaseId(Long caseId);
}
