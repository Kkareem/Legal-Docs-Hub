package com.legaldesk.modules.consultations.api;
import com.legaldesk.shared.security.AppUserPrincipal;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.common.domain.BusinessRuleViolationException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

@RestController
@Transactional
public class PublicConsultationController {
 private final JdbcTemplate jdbc;
 private final UserEntityRepository users;
 public PublicConsultationController(JdbcTemplate jdbc, UserEntityRepository users) { this.jdbc=jdbc; this.users=users; }
 public record SubmitRequest(@NotBlank @Size(max=200) String name, @NotBlank @Email @Size(max=254) String email,
   @NotBlank @Size(max=40) String phone, @NotBlank @Size(min=10,max=10000) String summary) {}
 public record TrackRequest(@NotNull Long id, @NotNull UUID token) {}
 public record Assignment(@Size(max=100) List<@NotNull Long> assigneeIds, Long assignedTo) {}
 public record Reply(@NotBlank @Size(max=20000) String response) {}
 public record VisitorReply(@NotNull Long id, @NotNull UUID token, @NotBlank @Size(max=20000) String response) {}
 public record Visit(@NotNull UUID visitorId) {}
 @PostMapping("/api/public/consultations") @ResponseStatus(HttpStatus.CREATED)
 public Map<String,Object> submit(@Valid @RequestBody SubmitRequest r) {
  UUID token=UUID.randomUUID();
  Long id=jdbc.queryForObject("INSERT INTO consultation_requests(tracking_token,name,email,phone,summary) VALUES (?,?,?,?,?) RETURNING id",
    Long.class,token,r.name().trim(),r.email().trim(),r.phone().trim(),r.summary().trim());
  return Map.of("id",id,"token",token);
 }
 @PostMapping("/api/public/consultations/track")
 public Map<String,Object> track(@Valid @RequestBody TrackRequest r) {
  var rows=jdbc.queryForList("SELECT id,summary,status,response,updated_at FROM consultation_requests WHERE id=? AND tracking_token=?",r.id(),r.token());
  if(rows.isEmpty()) throw new NotFoundException("Request not found");
  var result=rows.getFirst();
  result.put("messages", messages(r.id()));
  result.put("canReply", "answered".equals(result.get("status")));
  return result;
 }
 private List<Map<String,Object>> messages(Long id) {
  return jdbc.queryForList("SELECT id,sender_type,sender_name,body,created_at FROM consultation_messages WHERE request_id=? ORDER BY id",id);
 }
 @PostMapping("/api/public/consultations/reply")
 public Map<String,Object> visitorReply(@Valid @RequestBody VisitorReply r) {
  var rows=jdbc.queryForList("SELECT status FROM consultation_requests WHERE id=? AND tracking_token=? FOR UPDATE",r.id(),r.token());
  if(rows.isEmpty()) throw new NotFoundException("Request not found");
  if(!"answered".equals(rows.getFirst().get("status")))
   throw new BusinessRuleViolationException("Wait for the office reply");
  jdbc.update("INSERT INTO consultation_messages(request_id,sender_type,body) VALUES (?,'visitor',?)",r.id(),r.response().trim());
  jdbc.update("UPDATE consultation_requests SET status='pending',updated_at=NOW() WHERE id=?",r.id());
  return track(new TrackRequest(r.id(),r.token()));
 }
 @PostMapping("/api/public/visits") @ResponseStatus(HttpStatus.NO_CONTENT)
 public void visit(@Valid @RequestBody Visit r) {
  jdbc.update("INSERT INTO site_visitors(visitor_id) VALUES (?) ON CONFLICT DO NOTHING",r.visitorId());
 }
 private boolean admin(Authentication a) {
  return a.getAuthorities().stream().anyMatch(v->Set.of("ROLE_ADMIN","ROLE_OWNER").contains(v.getAuthority()));
 }
 @GetMapping("/api/consultation-requests")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER','LAWYER')")
 public List<Map<String,Object>> list(Authentication a) {
  String sql="SELECT r.id,r.name,r.email,r.phone,r.summary,r.status,r.assigned_to,r.response,r.created_at,u.name AS assignee_name FROM consultation_requests r LEFT JOIN users u ON u.id=r.assigned_to";
  var results=admin(a) ? jdbc.queryForList(sql+" ORDER BY r.created_at DESC") :
   jdbc.queryForList(sql+" WHERE EXISTS (SELECT 1 FROM consultation_assignees ca WHERE ca.request_id=r.id AND ca.user_id=?) ORDER BY r.created_at DESC",((AppUserPrincipal)a.getPrincipal()).id());
  for(var result:results) {
   result.put("messages",messages(((Number)result.get("id")).longValue()));
   result.put("assignees",jdbc.queryForList("SELECT u.id,u.name,u.active FROM consultation_assignees ca JOIN users u ON u.id=ca.user_id WHERE ca.request_id=? ORDER BY u.name,u.id",result.get("id")));
   result.put("canReply","pending".equals(result.get("status")));
  }
  return results;
 }
 @PatchMapping("/api/consultation-requests/{id}/assign")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
 public void assign(@PathVariable("id") Long id,@Valid @RequestBody Assignment r) {
  List<Long> ids=r.assigneeIds()!=null ? r.assigneeIds().stream().distinct().toList() :
   r.assignedTo()!=null ? List.of(r.assignedTo()) : List.of();
  if(jdbc.queryForList("SELECT id FROM consultation_requests WHERE id=? FOR UPDATE",id).isEmpty())
   throw new NotFoundException("Request not found");
  for(Long assigneeId:ids) {
   var lawyer=users.findById(assigneeId).orElseThrow(()->new NotFoundException("Lawyer not found"));
   if(!lawyer.isActive() || !"lawyer".equals(lawyer.getRole())) throw new BusinessRuleViolationException("Select an active lawyer");
  }
  jdbc.update("DELETE FROM consultation_assignees WHERE request_id=?",id);
  for(Long assigneeId:ids) jdbc.update("INSERT INTO consultation_assignees(request_id,user_id) VALUES (?,?)",id,assigneeId);
  jdbc.update("UPDATE consultation_requests SET assigned_to=?,updated_at=NOW() WHERE id=?",ids.isEmpty()?null:ids.getFirst(),id);
 }
 @PostMapping("/api/consultation-requests/{id}/reply")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER','LAWYER')")
 public void reply(@PathVariable("id") Long id,@Valid @RequestBody Reply r,Authentication a) {
  Long userId=((AppUserPrincipal)a.getPrincipal()).id();
  var rows=jdbc.queryForList("SELECT status FROM consultation_requests WHERE id=? FOR UPDATE",id);
  if(rows.isEmpty()) throw new NotFoundException("Request not found");
  if(!admin(a) && jdbc.queryForObject("SELECT COUNT(*) FROM consultation_assignees WHERE request_id=? AND user_id=?",Long.class,id,userId)==0)
   throw new NotFoundException("Request not found");
  if(!"pending".equals(rows.getFirst().get("status")))
   throw new BusinessRuleViolationException("Wait for the visitor reply");
  var sender=users.findById(userId).orElseThrow(()->new NotFoundException("User not found"));
  jdbc.update("INSERT INTO consultation_messages(request_id,sender_type,sender_id,sender_name,body) VALUES (?,'staff',?,?,?)",id,userId,sender.getName(),r.response().trim());
  jdbc.update("UPDATE consultation_requests SET response=?,status='answered',responded_by=?,updated_at=NOW() WHERE id=?",r.response().trim(),userId,id);
 }
}

