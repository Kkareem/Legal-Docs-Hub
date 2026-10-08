package com.legaldesk.modules.cases.api;
import com.legaldesk.modules.cases.application.CaseAccessService;
import com.legaldesk.common.domain.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/cases/{caseId}")
@Transactional
public class CaseDetailsController {
 private final JdbcTemplate jdbc;private final CaseAccessService access;
 public CaseDetailsController(JdbcTemplate jdbc,CaseAccessService access){this.jdbc=jdbc;this.access=access;}
 public record Opponent(@Size(max=200) String name,@Size(max=50) String phone,@Email @Size(max=320) String email,
  @Size(max=64) String nationalId,@Size(max=500) String relationship,Long relatedClientId){}
 @GetMapping("/activity") public List<Map<String,Object>> activity(@PathVariable long caseId){access.require(caseId);return jdbc.queryForList("SELECT id,actor_id,actor_name,entity,entity_id,action,changes::text AS changes,created_at FROM case_activity WHERE case_id=? ORDER BY id DESC",caseId);}
 @GetMapping("/opponents") public List<Map<String,Object>> opponents(@PathVariable long caseId){access.require(caseId);return jdbc.queryForList("SELECT o.*,c.name AS related_client_name FROM case_opponents o LEFT JOIN clients c ON c.id=o.related_client_id WHERE o.case_id=? ORDER BY o.id",caseId);}
 private void validateClient(long id,Long client){if(client!=null&&jdbc.queryForObject("SELECT COUNT(*) FROM case_clients WHERE case_id=? AND client_id=?",Long.class,id,client)==0)throw new BusinessRuleViolationException("Related client must belong to this case");}
 @PostMapping("/opponents") public Map<String,Long> create(@PathVariable long caseId,@Valid @RequestBody Opponent r){access.require(caseId);validateClient(caseId,r.relatedClientId());return Map.of("id",jdbc.queryForObject("INSERT INTO case_opponents(case_id,name,phone,email,national_id,relationship,related_client_id) VALUES(?,?,?,?,?,?,?) RETURNING id",Long.class,caseId,r.name(),r.phone(),r.email(),r.nationalId(),r.relationship(),r.relatedClientId()));}
 @PutMapping("/opponents/{id}") public void update(@PathVariable long caseId,@PathVariable long id,@Valid @RequestBody Opponent r){access.require(caseId);validateClient(caseId,r.relatedClientId());if(jdbc.update("UPDATE case_opponents SET name=?,phone=?,email=?,national_id=?,relationship=?,related_client_id=? WHERE id=? AND case_id=?",r.name(),r.phone(),r.email(),r.nationalId(),r.relationship(),r.relatedClientId(),id,caseId)==0)throw new NotFoundException("Opponent not found");}
 @DeleteMapping("/opponents/{id}") public void delete(@PathVariable long caseId,@PathVariable long id){access.require(caseId);if(jdbc.update("DELETE FROM case_opponents WHERE id=? AND case_id=?",id,caseId)==0)throw new NotFoundException("Opponent not found");}
}
