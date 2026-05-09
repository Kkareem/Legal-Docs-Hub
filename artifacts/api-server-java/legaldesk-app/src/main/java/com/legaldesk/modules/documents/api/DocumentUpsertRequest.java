package com.legaldesk.modules.documents.api;

public record DocumentUpsertRequest(
        Long caseId,
        Long clientId,
        String fileUrl,
        String fileName,
        String docType,
        Boolean isOriginal,
        Long uploadedBy,
        String notes
) {
}
