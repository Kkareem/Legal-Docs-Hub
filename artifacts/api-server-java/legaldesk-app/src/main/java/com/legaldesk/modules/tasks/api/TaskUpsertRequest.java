package com.legaldesk.modules.tasks.api;

import java.time.OffsetDateTime;

public record TaskUpsertRequest(
        String title,
        String description,
        Long caseId,
        Long assignedTo,
        OffsetDateTime dueDate,
        String priority,
        String status
) {
}
