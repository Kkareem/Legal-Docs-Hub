package com.legaldesk.modules.poa.api;

import com.legaldesk.modules.poa.application.PowerOfAttorneyApplicationService;
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
@RequestMapping("/api/powers-of-attorney")
public class PowerOfAttorneyController {
    private final PowerOfAttorneyApplicationService service;
    public PowerOfAttorneyController(PowerOfAttorneyApplicationService service) { this.service = service; }
    @GetMapping public List<PowerOfAttorneyResponse> list(@RequestParam(value = "status", required = false) String status, @RequestParam(value = "receivedBy", required = false) Long receivedBy) { return service.list(status, receivedBy); }
    @GetMapping("/{id}") public PowerOfAttorneyResponse get(@PathVariable("id") Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public PowerOfAttorneyResponse create(@RequestBody PowerOfAttorneyUpsertRequest request) { return service.create(request); }
    @PatchMapping("/{id}") public PowerOfAttorneyResponse update(@PathVariable("id") Long id, @RequestBody PowerOfAttorneyUpsertRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable("id") Long id) { service.delete(id); }
}
