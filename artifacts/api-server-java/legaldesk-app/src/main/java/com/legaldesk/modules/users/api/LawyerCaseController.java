package com.legaldesk.modules.users.api;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.legaldesk.modules.users.application.LawyerCaseService;

@RestController
@RequestMapping("/api/lawyers")
@PreAuthorize("hasAnyRole('ADMIN','OWNER')")
public class LawyerCaseController {
 private final LawyerCaseService service;
 public LawyerCaseController(LawyerCaseService service){this.service=service;}
 public record Reassignment(Long lawyerId){}
 @GetMapping("/{id}") public Map<String,Object> detail(@PathVariable("id")long id){return service.details(id);}
 @GetMapping("/{id}/cases") public List<Map<String,Object>> cases(@PathVariable("id")long id){return service.cases(id);}
 @PostMapping("/{id}/cases/{caseId}/reassign") public void reassign(@PathVariable("id")long id,@PathVariable("caseId")long caseId,@RequestBody Reassignment r){service.reassign(id,caseId,r.lawyerId());}
}
