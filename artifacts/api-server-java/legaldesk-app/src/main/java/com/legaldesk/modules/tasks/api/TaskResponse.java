package com.legaldesk.modules.tasks.api;

import java.time.OffsetDateTime;

public record TaskResponse(
        Long id,
        String title,
        String description,
        Long caseId,
        String caseNumber,
        Long assignedTo,
        String assigneeName,
        OffsetDateTime dueDate,
        String priority,
        String status,
        Long officeId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
