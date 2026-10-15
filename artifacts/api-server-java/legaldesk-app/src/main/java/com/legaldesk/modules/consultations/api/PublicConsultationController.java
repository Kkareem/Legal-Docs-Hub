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
public class PublicConsultationController {
 @org.springframework.beans.factory.annotation.Autowired private com.legaldesk.modules.consultations.application.ConsultationContactLinker linker;
 @org.springframework.beans.factory.annotation.Autowired private com.legaldesk.modules.consultations.application.ConsultationVerificationService verification;
 private final JdbcTemplate jdbc;
 private final UserEntityRepository users;
 public PublicConsultationController(JdbcTemplate jdbc, UserEntityRepository users) { this.jdbc=jdbc; this.users=users; }
 public record SubmitRequest(@NotBlank @Size(max=200) String name, @Email @Size(max=254) String email,
   @Size(max=40) String phone, @NotBlank @Size(min=10,max=10000) String summary) {}
 public record TrackRequest(@NotBlank @Size(max=100) String accessToken) {}
 public record VerificationRequest(@NotBlank @Size(max=254) String contact) {}
 public record VerifyRequest(@NotNull UUID challengeId,@NotBlank @Pattern(regexp="[0-9]{6}") String code) {}
 public record Assignment(@Size(max=100) List<@NotNull Long> assigneeIds, Long assignedTo) {}
 public record Reply(@NotBlank @Size(max=20000) String response) {}
 public record VisitorReply(@NotNull Long id, @NotBlank @Size(max=100) String accessToken, @NotBlank @Size(max=20000) String response) {}
 public record Visit(@NotNull UUID visitorId) {}
 @Transactional
 @PostMapping("/api/public/consultations") @ResponseStatus(HttpStatus.CREATED)
 public Map<String,Object> submit(@Valid @RequestBody SubmitRequest r) {
  String email=com.legaldesk.shared.security.ContactDetails.email(r.email()),phone=com.legaldesk.shared.security.ContactDetails.phone(r.phone());com.legaldesk.shared.security.ContactDetails.requireContact(email,phone);
  UUID token=UUID.randomUUID();Long clientId=linker.find(email,phone);
  Long id=jdbc.queryForObject("INSERT INTO consultation_requests(tracking_token,name,email,phone,summary,client_id) VALUES (?,?,?,?,?,?) RETURNING id",Long.class,token,r.name().trim(),email,phone,r.summary().trim(),clientId);
  return Map.of("id",id);
 }
 @PostMapping("/api/public/consultations/verification/request")
 public Map<String,Object> requestCode(@Valid @RequestBody VerificationRequest r,jakarta.servlet.http.HttpServletRequest request){return verification.request(r.contact(),request.getRemoteAddr());}
 @PostMapping("/api/public/consultations/verification/verify")
 public Map<String,Object> verifyCode(@Valid @RequestBody VerifyRequest r){return verification.verify(r.challengeId(),r.code());}
 @PostMapping("/api/public/consultations/track")
 public List<Map<String,Object>> track(@Valid @RequestBody TrackRequest r){
  String contact=verification.contact(r.accessToken());String column=contact.contains("@")?com.legaldesk.modules.consultations.application.ConsultationContactLinker.EMAIL:com.legaldesk.modules.consultations.application.ConsultationContactLinker.PHONE;
  var rows=jdbc.queryForList("SELECT id,summary,status,response,updated_at FROM consultation_requests WHERE "+column+"=? ORDER BY created_at DESC",contact);
  for(var row:rows)decorate(row);return rows;
 }
 private Map<String,Object> decorate(Map<String,Object> row){row.put("messages",messages(((Number)row.get("id")).longValue()));row.put("canReply","answered".equals(row.get("status")));return row;}
 private List<Map<String,Object>> messages(Long id) {
  return jdbc.queryForList("SELECT id,sender_type,sender_name,body,created_at FROM consultation_messages WHERE request_id=? ORDER BY id",id);
 }
 @Transactional
 @PostMapping("/api/public/consultations/reply")
 public Map<String,Object> visitorReply(@Valid @RequestBody VisitorReply r) {
  String contact=verification.contact(r.accessToken());String column=contact.contains("@")?com.legaldesk.modules.consultations.application.ConsultationContactLinker.EMAIL:com.legaldesk.modules.consultations.application.ConsultationContactLinker.PHONE;
  var rows=jdbc.queryForList("SELECT status FROM consultation_requests WHERE id=? AND "+column+"=? FOR UPDATE",r.id(),contact);
  if(rows.isEmpty()) throw new NotFoundException("Request not found");
  if(!"answered".equals(rows.getFirst().get("status")))
   throw new BusinessRuleViolationException("Wait for the office reply");
  jdbc.update("INSERT INTO consultation_messages(request_id,sender_type,body) VALUES (?,'visitor',?)",r.id(),r.response().trim());
  jdbc.update("UPDATE consultation_requests SET status='pending',updated_at=NOW() WHERE id=?",r.id());
  return decorate(jdbc.queryForMap("SELECT id,summary,status,response,updated_at FROM consultation_requests WHERE id=?",r.id()));
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
 @Transactional
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
 @Transactional
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

