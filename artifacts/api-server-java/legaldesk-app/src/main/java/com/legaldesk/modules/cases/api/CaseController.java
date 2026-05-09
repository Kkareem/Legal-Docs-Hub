package com.legaldesk.modules.cases.api;

import com.legaldesk.modules.cases.application.CaseApplicationService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseApplicationService service;

    public CaseController(CaseApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public List<CaseResponse> list(@RequestParam(value = "status", required = false) String status,
                                   @RequestParam(value = "type", required = false) String type,
                                   @RequestParam(value = "lawyerId", required = false) Long lawyerId,
                                   @RequestParam(value = "clientId", required = false) Long clientId,
                                   @RequestParam(value = "search", required = false) String search) {
        return service.list(status, type, lawyerId, clientId, search);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CaseResponse create(@Valid @RequestBody CreateCaseRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public CaseResponse get(@PathVariable("id") Long id) {
        return service.get(id);
    }

    @PatchMapping("/{id}")
    public CaseResponse update(@PathVariable("id") Long id, @RequestBody UpdateCaseRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        service.delete(id);
    }
}
