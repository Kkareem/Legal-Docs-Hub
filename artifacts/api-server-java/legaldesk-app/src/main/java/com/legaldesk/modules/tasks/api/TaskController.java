package com.legaldesk.modules.tasks.api;

import com.legaldesk.modules.tasks.application.TaskApplicationService;
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
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskApplicationService service;
    public TaskController(TaskApplicationService service) { this.service = service; }
    @GetMapping public List<TaskResponse> list(@RequestParam(value = "status", required = false) String status,
                                              @RequestParam(value = "assignedTo", required = false) Long assignedTo,
                                              @RequestParam(value = "caseId", required = false) Long caseId,
                                              @RequestParam(value = "priority", required = false) String priority) {
        return service.list(status, assignedTo, caseId, priority);
    }
    @GetMapping("/{id}") public TaskResponse get(@PathVariable("id") Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public TaskResponse create(@RequestBody TaskUpsertRequest request) { return service.create(request); }
    @PatchMapping("/{id}") public TaskResponse update(@PathVariable("id") Long id, @RequestBody TaskUpsertRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable("id") Long id) { service.delete(id); }
}
