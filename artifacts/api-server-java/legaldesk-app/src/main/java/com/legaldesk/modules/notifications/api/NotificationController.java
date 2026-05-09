package com.legaldesk.modules.notifications.api;

import com.legaldesk.modules.notifications.application.NotificationApplicationService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationApplicationService service;
    public NotificationController(NotificationApplicationService service) { this.service = service; }
    @GetMapping public List<NotificationResponse> list(@RequestParam(value = "unreadOnly", required = false) Boolean unreadOnly) { return service.list(unreadOnly); }
    @PatchMapping("/{id}/read") public NotificationResponse markRead(@PathVariable("id") Long id) { return service.markRead(id); }
    @PatchMapping("/read-all") public Map<String, Boolean> markAllRead() { return service.markAllRead(); }
}
