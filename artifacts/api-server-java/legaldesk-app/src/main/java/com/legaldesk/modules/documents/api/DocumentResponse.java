package com.legaldesk.modules.documents.api;

import java.time.OffsetDateTime;

public record DocumentResponse(
        Long id,
        Long caseId,
        Long clientId,
        String fileUrl,
        String fileName,
        String docType,
        boolean isOriginal,
        Long uploadedBy,
        String uploaderName,
        String notes,
        OffsetDateTime createdAt
) {
}
