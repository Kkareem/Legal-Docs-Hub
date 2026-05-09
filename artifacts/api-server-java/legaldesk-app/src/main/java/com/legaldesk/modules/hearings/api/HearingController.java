package com.legaldesk.modules.hearings.api;

import com.legaldesk.modules.hearings.application.HearingApplicationService;
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
@RequestMapping("/api/hearings")
public class HearingController {
    private final HearingApplicationService service;
    public HearingController(HearingApplicationService service) { this.service = service; }
    @GetMapping public List<HearingResponse> list(@RequestParam(value = "caseId", required = false) Long caseId,
                                                 @RequestParam(value = "assignedLawyer", required = false) Long assignedLawyer,
                                                 @RequestParam(value = "status", required = false) String status,
                                                 @RequestParam(value = "upcoming", required = false) Boolean upcoming) { return service.list(caseId, assignedLawyer, status, upcoming); }
    @GetMapping("/{id}") public HearingResponse get(@PathVariable("id") Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public HearingResponse create(@RequestBody HearingUpsertRequest request) { return service.create(request); }
    @PatchMapping("/{id}") public HearingResponse update(@PathVariable("id") Long id, @RequestBody HearingUpsertRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable("id") Long id) { service.delete(id); }
}
