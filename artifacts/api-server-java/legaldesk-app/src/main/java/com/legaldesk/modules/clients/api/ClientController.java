package com.legaldesk.modules.clients.api;

import com.legaldesk.modules.clients.application.ClientApplicationService;
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
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientApplicationService service;

    public ClientController(ClientApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public List<ClientResponse> list(@RequestParam(value = "status", required = false) String status,
                                     @RequestParam(value = "search", required = false) String search) {
        return service.list(status, search);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientResponse create(@Valid @RequestBody CreateClientRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public ClientResponse get(@PathVariable("id") Long id) {
        return service.get(id);
    }

    @PatchMapping("/{id}")
    public ClientResponse update(@PathVariable("id") Long id, @RequestBody UpdateClientRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        service.delete(id);
    }

    @GetMapping("/{id}/summary")
    public ClientSummaryResponse summary(@PathVariable("id") Long id) {
        return service.summary(id);
    }
}
