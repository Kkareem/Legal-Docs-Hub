package com.legaldesk.modules.documents.api;

import com.legaldesk.modules.documents.application.DocumentApplicationService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private final DocumentApplicationService service;
    public DocumentController(DocumentApplicationService service) { this.service = service; }
    @GetMapping public List<DocumentResponse> list(@RequestParam(value = "caseId", required = false) Long caseId,
                                                  @RequestParam(value = "clientId", required = false) Long clientId,
                                                  @RequestParam(value = "docType", required = false) String docType) { return service.list(caseId, clientId, docType); }
    @GetMapping("/{id}") public DocumentResponse get(@PathVariable("id") Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public DocumentResponse create(@RequestBody DocumentUpsertRequest request) { return service.create(request); }
    @PatchMapping("/{id}") public DocumentResponse update(@PathVariable("id") Long id, @RequestBody DocumentUpsertRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable("id") Long id) { service.delete(id); }
}
