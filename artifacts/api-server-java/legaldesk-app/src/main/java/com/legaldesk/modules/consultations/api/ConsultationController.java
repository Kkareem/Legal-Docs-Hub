package com.legaldesk.modules.consultations.api;

import com.legaldesk.modules.consultations.application.ConsultationApplicationService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {
    private final ConsultationApplicationService service;
    public ConsultationController(ConsultationApplicationService service) { this.service = service; }
    @GetMapping public List<ConsultationResponse> list(@RequestParam(value = "status", required = false) String status, @RequestParam(value = "clientId", required = false) Long clientId) { return service.list(status, clientId); }
    @GetMapping("/{id}") public ConsultationResponse get(@PathVariable("id") Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ConsultationResponse create(@RequestBody ConsultationUpsertRequest request) { return service.create(request); }
    @PatchMapping("/{id}") public ConsultationResponse update(@PathVariable("id") Long id, @RequestBody ConsultationUpsertRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable("id") Long id) { service.delete(id); }
}
