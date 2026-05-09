package com.legaldesk.modules.notifications.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.notifications.api.NotificationResponse;
import com.legaldesk.modules.notifications.domain.NotificationEntity;
import com.legaldesk.modules.notifications.infrastructure.NotificationEntityRepository;
import com.legaldesk.shared.security.CurrentUserFacade;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationApplicationService {
    private final NotificationEntityRepository repository;
    private final CurrentUserFacade currentUserFacade;
    public NotificationApplicationService(NotificationEntityRepository repository, CurrentUserFacade currentUserFacade) {
        this.repository = repository;
        this.currentUserFacade = currentUserFacade;
    }
    @Transactional(readOnly = true)
    public List<NotificationResponse> list(Boolean unreadOnly) {
        Long userId = currentUserFacade.currentUserId();
        return repository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .filter(entity -> unreadOnly == null || !unreadOnly || !entity.isRead())
                .map(this::toResponse)
                .toList();
    }
    public NotificationResponse markRead(Long id) {
        NotificationEntity entity = repository.findById(id).orElseThrow(() -> new NotFoundException("Notification not found"));
        entity.setRead(true);
        return toResponse(repository.save(entity));
    }
    public Map<String, Boolean> markAllRead() {
        Long userId = currentUserFacade.currentUserId();
        repository.findByUserIdOrderByCreatedAtAsc(userId).forEach(entity -> {
            entity.setRead(true);
            repository.save(entity);
        });
        return Map.of("ok", true);
    }
    private NotificationResponse toResponse(NotificationEntity entity) {
        return new NotificationResponse(entity.getId(), entity.getUserId(), entity.getType(), entity.getTitle(),
                entity.getBody(), entity.isRead(), entity.getRefId(), entity.getRefType(), entity.getCreatedAt());
    }
}
