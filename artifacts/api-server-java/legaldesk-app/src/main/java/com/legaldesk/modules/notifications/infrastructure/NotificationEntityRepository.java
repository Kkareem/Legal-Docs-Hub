package com.legaldesk.modules.notifications.infrastructure;

import com.legaldesk.modules.notifications.domain.NotificationEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationEntityRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByUserIdOrderByCreatedAtAsc(Long userId);
}
