package com.legaldesk.modules.payments.api;

import com.legaldesk.modules.payments.application.PaymentApplicationService;
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
@RequestMapping("/api")
public class PaymentController {
    private final PaymentApplicationService service;
    public PaymentController(PaymentApplicationService service) { this.service = service; }
    @GetMapping("/payments") public List<PaymentResponse> list(@RequestParam(value = "clientId", required = false) Long clientId, @RequestParam(value = "caseId", required = false) Long caseId, @RequestParam(value = "status", required = false) String status) { return service.list(clientId, caseId, status); }
    @GetMapping("/payments/{id}") public PaymentResponse get(@PathVariable("id") Long id) { return service.get(id); }
    @PostMapping("/payments") @ResponseStatus(HttpStatus.CREATED) public PaymentResponse create(@RequestBody PaymentUpsertRequest request) { return service.create(request); }
    @PatchMapping("/payments/{id}") public PaymentResponse update(@PathVariable("id") Long id, @RequestBody PaymentUpsertRequest request) { return service.update(id, request); }
    @DeleteMapping("/payments/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable("id") Long id) { service.delete(id); }
    @GetMapping("/dashboard/payment-summary") public PaymentSummaryResponse paymentSummary() { return service.summary(); }
}
