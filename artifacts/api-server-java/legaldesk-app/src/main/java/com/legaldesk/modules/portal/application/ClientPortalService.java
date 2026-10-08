package com.legaldesk.modules.portal.application;

import com.legaldesk.common.domain.*;
import com.legaldesk.modules.users.domain.UserEntity;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import com.legaldesk.shared.security.AppUserPrincipal;
import java.util.*;
import java.io.IOException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class ClientPortalService {
 private final JdbcTemplate jdbc;
 private final UserEntityRepository users;
 private final PasswordEncoder encoder;
 public ClientPortalService(JdbcTemplate jdbc,UserEntityRepository users,PasswordEncoder encoder){this.jdbc=jdbc;this.users=users;this.encoder=encoder;}
 public long userId(Authentication a){return ((AppUserPrincipal)a.getPrincipal()).id();}
 public boolean admin(Authentication a){return a.getAuthorities().stream().anyMatch(v->Set.of("ROLE_ADMIN","ROLE_OWNER").contains(v.getAuthority()));}
 public Map<String,Object> one(String sql,Object...args){var rows=jdbc.queryForList(sql,args);if(rows.isEmpty())throw new NotFoundException("Record not found");return rows.getFirst();}
 public long clientId(Authentication a){return ((Number)one("SELECT id FROM clients WHERE user_id=?",userId(a)).get("id")).longValue();}
 public Map<String,Object> clientCase(long id,Authentication a){return one("SELECT c.*,u.name AS lawyer_name FROM cases c LEFT JOIN users u ON u.id=c.lead_lawyer_id WHERE c.id=? AND EXISTS(SELECT 1 FROM case_clients cc WHERE cc.case_id=c.id AND cc.client_id=?)",id,clientId(a));}
 public Map<String,Object> staffCase(long id,Authentication a){
  var c=one("SELECT c.*,u.name AS lawyer_name FROM cases c LEFT JOIN users u ON u.id=c.lead_lawyer_id WHERE c.id=?",id);
  if(!admin(a) && jdbc.queryForObject("SELECT COUNT(*) FROM case_lawyers WHERE case_id=? AND user_id=?",Long.class,id,userId(a))==0)throw new NotFoundException("Case not found");
  return c;
 }
 public Map<String,Object> createAccount(long id,String email,String password,Authentication a){
  var c=one("SELECT id,name,phone,user_id,office_id FROM clients WHERE id=? FOR UPDATE",id);
  if(!admin(a) && jdbc.queryForObject("SELECT COUNT(*) FROM case_clients cc JOIN case_lawyers l ON l.case_id=cc.case_id WHERE cc.client_id=? AND l.user_id=?",Long.class,id,userId(a))==0)
   throw new NotFoundException("Client not found");
  if(c.get("user_id")!=null)throw new BusinessRuleViolationException("Client already has an account");
  email=email.trim().toLowerCase(Locale.ROOT);
  if(users.findByEmailIgnoreCase(email).isPresent())throw new BusinessRuleViolationException("Email already exists");
  var user=new UserEntity();user.setName((String)c.get("name"));user.setEmail(email);user.setPhone((String)c.get("phone"));
  user.setPasswordHash(encoder.encode(password));user.setRole("client");user.setMustChangePassword(true);user.setActive(true);
  if(c.get("office_id")!=null)user.setOfficeId(((Number)c.get("office_id")).longValue());
  user=users.saveAndFlush(user);
  jdbc.update("UPDATE clients SET user_id=?,email=?,updated_at=NOW() WHERE id=?",user.getId(),email,id);
  return Map.of("id",user.getId(),"email",email,"mustChangePassword",true);
 }
 public Map<String,Object> overview(Authentication a){
  long id=clientId(a);
  var client=one("SELECT id,name,email,phone FROM clients WHERE id=?",id);
  var cases=jdbc.queryForList("SELECT c.id,c.case_number,c.court_case_number,c.type,c.court,c.division,c.status,c.description,c.lead_lawyer_id,u.name AS lawyer_name,c.created_at,c.updated_at FROM cases c LEFT JOIN users u ON u.id=c.lead_lawyer_id WHERE EXISTS(SELECT 1 FROM case_clients cc WHERE cc.case_id=c.id AND cc.client_id=?) ORDER BY c.created_at DESC",id);
  for(var c:cases)c.put("lawyers",caseLawyers(((Number)c.get("id")).longValue()));
  var hearings=jdbc.queryForList("SELECT h.id,h.case_id,c.case_number,h.datetime,h.court,h.type,h.status FROM hearings h JOIN cases c ON c.id=h.case_id WHERE EXISTS(SELECT 1 FROM case_clients cc WHERE cc.case_id=c.id AND cc.client_id=?) ORDER BY h.datetime",id);
  var payments=jdbc.queryForList("SELECT p.id,p.case_id,c.case_number,p.amount,p.type,p.status,p.paid_at,p.notes,p.created_at FROM payments p LEFT JOIN cases c ON c.id=p.case_id WHERE p.client_id=? ORDER BY p.created_at DESC",id);
  var consults=jdbc.queryForList("SELECT id,summary,status,response,created_at FROM consultations WHERE client_id=? ORDER BY created_at DESC",id);
  var requests=jdbc.queryForList("SELECT id,case_id,summary,status,created_at FROM consultation_requests WHERE client_id=? ORDER BY created_at DESC",id);
  for(var q:requests){q.put("messages",messages(((Number)q.get("id")).longValue()));q.put("canReply","answered".equals(q.get("status")));}
  for(var payment:payments)payment.put("receipts",receipts(((Number)payment.get("id")).longValue()));
  return Map.of("client",client,"cases",cases,"hearings",hearings,"payments",payments,"consultations",consults,"requests",requests,"bank",bankDetails());
 }
 private List<Map<String,Object>> messages(long id){return jdbc.queryForList("SELECT id,sender_type,sender_name,body,created_at FROM consultation_messages WHERE request_id=? ORDER BY id",id);}
 public Map<String,Object> caseDetails(long id,Authentication a,boolean staff){
  var c=staff?staffCase(id,a):clientCase(id,a);
  // Internal client notes and hearing notes are intentionally excluded from portal projections.
  var safe=new LinkedHashMap<String,Object>();
  for(String key:List.of("id","case_number","court_case_number","type","court","division","status","description","lawyer_name","lead_lawyer_id","created_at","updated_at"))safe.put(key,c.get(key));
  return Map.of("case",safe,
   "updates",jdbc.queryForList("SELECT cu.id,cu.title,cu.body,cu.status,cu.created_at,u.name AS author_name FROM case_updates cu LEFT JOIN users u ON u.id=cu.created_by WHERE cu.case_id=? ORDER BY cu.id",id),
   "hearings",jdbc.queryForList("SELECT id,datetime,court,type,status FROM hearings WHERE case_id=? ORDER BY datetime",id),
   "files",jdbc.queryForList("SELECT id,file_name,file_size,created_at FROM documents WHERE content IS NOT NULL AND case_id=? ORDER BY id",id),
   "documents",jdbc.queryForList("SELECT id,file_name,doc_type,created_at FROM documents WHERE content IS NULL AND case_id=? ORDER BY id",id),
   "reviews",jdbc.queryForList("SELECT r.stars,r.comment,r.lawyer_id,r.client_id,r.created_at,u.name AS lawyer_name,cl.name AS client_name FROM case_reviews r JOIN users u ON u.id=r.lawyer_id JOIN clients cl ON cl.id=r.client_id WHERE r.case_id=? AND (? OR r.client_id=?)",id,staff,staff?null:clientId(a)),
   "payments",casePayments(id,staff?null:clientId(a)),
   "lawyers",caseLawyers(id),
   "clients",staff?jdbc.queryForList("SELECT cl.id,cl.name FROM case_clients cc JOIN clients cl ON cl.id=cc.client_id WHERE cc.case_id=? ORDER BY cl.id",id):List.of());
 }
 private List<Map<String,Object>> caseLawyers(long id){return jdbc.queryForList("SELECT u.id,u.name FROM case_lawyers l JOIN users u ON u.id=l.user_id WHERE l.case_id=? ORDER BY u.id",id);}
 private List<Map<String,Object>> casePayments(long id,Long clientId){
  var payments=jdbc.queryForList("SELECT p.id,p.client_id,cl.name AS client_name,p.amount,p.type,p.status,p.notes,p.paid_at FROM payments p JOIN clients cl ON cl.id=p.client_id WHERE p.case_id=? AND (CAST(? AS BIGINT) IS NULL OR p.client_id=?) ORDER BY p.id",id,clientId,clientId);
  for(var p:payments)p.put("receipts",receipts(((Number)p.get("id")).longValue()));
  return payments;
 }
 public List<Map<String,Object>> upload(long caseId,MultipartFile[] files,Authentication a,boolean staff)throws IOException{
  var c=staff?staffCase(caseId,a):clientCase(caseId,a);
  if(files.length<1 || files.length>10)throw new BusinessRuleViolationException("Choose between 1 and 10 files");
  long total=0;for(var file:files){validateFile(file);total+=file.getSize();}
  if(total>50L*1024*1024)throw new BusinessRuleViolationException("Total upload exceeds 50 MB");
  List<Map<String,Object>> result=new ArrayList<>();
  for(var file:files){long fileId=saveFile(file,staff?((Number)c.get("client_id")).longValue():clientId(a),caseId,null,userId(a));result.add(Map.of("id",fileId,"file_name",safeName(file.getOriginalFilename())));}
  return result;
 }
 public void validateFile(MultipartFile file){
  if(file==null || file.isEmpty() || file.getSize()>20L*1024*1024)throw new BusinessRuleViolationException("Each file must be nonempty and at most 20 MB");
 }
 private String safeName(String name){if(name==null)return "attachment";name=name.replace('\\','/');name=name.substring(name.lastIndexOf('/')+1).replaceAll("[\\p{Cntrl}]","_");return name.isBlank()?"attachment":name.substring(0,Math.min(200,name.length()));}
 public long saveFile(MultipartFile file,long clientId,Long caseId,Long paymentId,long userId)throws IOException{
  validateFile(file);long id=jdbc.queryForObject("INSERT INTO documents(client_id,case_id,payment_id,uploaded_by,file_name,file_url,content_type,file_size,content) VALUES (?,?,?,?,?,'',?,?,?) RETURNING id",
   Long.class,clientId,caseId,paymentId,userId,safeName(file.getOriginalFilename()),"application/octet-stream",file.getSize(),file.getBytes());
  jdbc.update("UPDATE documents SET file_url=? WHERE id=?","/api/office-portal/documents/"+id+"/content",id);
  return id;
 }
 public Map<String,Object> legacyDownload(long id,Authentication a,boolean staff){
  long documentId=((Number)one("SELECT id FROM documents WHERE legacy_portal_file_id=?",id).get("id")).longValue();
  return download(documentId,a,staff);
 }
 public Map<String,Object> download(long id,Authentication a,boolean staff){
  var file=one("SELECT id,client_id,case_id FROM documents WHERE content IS NOT NULL AND id=?",id);
  if(!staff){
   if(file.get("case_id")!=null)clientCase(((Number)file.get("case_id")).longValue(),a);
   else if(!Objects.equals(file.get("client_id"),clientId(a)))throw new NotFoundException("File not found");
  }
  else if(!admin(a)){
   if(file.get("case_id")==null)throw new NotFoundException("File not found");
   staffCase(((Number)file.get("case_id")).longValue(),a);
  }
  return one("SELECT file_name,content FROM documents WHERE content IS NOT NULL AND id=?",id);
 }
 public void review(long caseId,Long lawyerId,int stars,String comment,Authentication a){
  var c=one("SELECT * FROM cases WHERE id=? AND EXISTS(SELECT 1 FROM case_clients cc WHERE cc.case_id=cases.id AND cc.client_id=?) FOR UPDATE",caseId,clientId(a));
  if(lawyerId==null&&c.get("lead_lawyer_id")!=null)lawyerId=((Number)c.get("lead_lawyer_id")).longValue();
  if(!"closed".equals(c.get("status")) || lawyerId==null || jdbc.queryForObject("SELECT COUNT(*) FROM case_lawyers WHERE case_id=? AND user_id=?",Long.class,caseId,lawyerId)==0)throw new BusinessRuleViolationException("Only closed cases with a lawyer can be reviewed");
  if(jdbc.queryForObject("SELECT COUNT(*) FROM case_reviews WHERE case_id=? AND client_id=? AND lawyer_id=?",Long.class,caseId,clientId(a),lawyerId)>0)throw new BusinessRuleViolationException("Case already reviewed");
  jdbc.update("INSERT INTO case_reviews(case_id,client_id,lawyer_id,stars,comment) VALUES (?,?,?,?,?)",caseId,clientId(a),lawyerId,stars,comment);
 }
 public void updateCase(long id,String title,String body,String status,Authentication a){
  var c=staffCase(id,a);
  String next=status==null?(String)c.get("status"):status;
  if(!Set.of("new","active","upcoming_hearing","verdict","adjourned","closed").contains(next))throw new BusinessRuleViolationException("Invalid case status");
  jdbc.update("UPDATE cases SET status=?,updated_at=NOW() WHERE id=?",next,id);
  jdbc.update("INSERT INTO case_updates(case_id,title,body,status,created_by) VALUES (?,?,?,?,?)",id,title,body,next,userId(a));
 }
 public long newConsultation(String summary,Long caseId,Authentication a){
  long clientId=clientId(a);
  var client=one("SELECT name,email,phone FROM clients WHERE id=?",clientId);
  Map<String,Object> c=caseId==null?null:clientCase(caseId,a);
  Long id=jdbc.queryForObject("INSERT INTO consultation_requests(tracking_token,name,email,phone,summary,client_id,case_id) VALUES (?,?,?,?,?,?,?) RETURNING id",
   Long.class,UUID.randomUUID(),client.get("name"),client.get("email"),Objects.toString(client.get("phone"),""),summary,clientId,caseId);
  if(c!=null){
   jdbc.update("INSERT INTO consultation_assignees(request_id,user_id) SELECT ?,l.user_id FROM case_lawyers l JOIN users u ON u.id=l.user_id WHERE l.case_id=? AND u.active",id,caseId);
   jdbc.update("UPDATE consultation_requests SET assigned_to=? WHERE id=?",c.get("lead_lawyer_id"),id);
  }
  return id;
 }
 public void linkConsultation(long id,UUID token,Authentication a){
  var q=one("SELECT client_id FROM consultation_requests WHERE id=? AND tracking_token=? FOR UPDATE",id,token);
  long clientId=clientId(a);
  if(q.get("client_id")!=null && !Objects.equals(q.get("client_id"),clientId))throw new NotFoundException("Request not found");
  jdbc.update("UPDATE consultation_requests SET client_id=? WHERE id=?",clientId,id);
 }
 public void consultationReply(long id,String response,Authentication a){
  var q=one("SELECT status FROM consultation_requests WHERE id=? AND client_id=? FOR UPDATE",id,clientId(a));
  if(!"answered".equals(q.get("status")))throw new BusinessRuleViolationException("Wait for office reply");
  jdbc.update("INSERT INTO consultation_messages(request_id,sender_type,body) VALUES (?,'visitor',?)",id,response);
  jdbc.update("UPDATE consultation_requests SET status='pending',updated_at=NOW() WHERE id=?",id);
 }
 private List<Map<String,Object>> receipts(long paymentId){
  return jdbc.queryForList("SELECT pr.id,pr.file_id,pr.reference,pr.status,pr.review_notes,pr.created_at,pr.reviewed_at FROM payment_receipts pr WHERE pr.payment_id=? ORDER BY pr.id DESC",paymentId);
 }
 public Map<String,Object> bankDetails(){var rows=jdbc.queryForList("SELECT bank_name,beneficiary,iban,instructions FROM office_bank_details WHERE id=1");return rows.isEmpty()?Map.of():rows.getFirst();}
 public void saveBank(String bank,String beneficiary,String iban,String instructions){
  jdbc.update("INSERT INTO office_bank_details(id,bank_name,beneficiary,iban,instructions) VALUES (1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET bank_name=EXCLUDED.bank_name,beneficiary=EXCLUDED.beneficiary,iban=EXCLUDED.iban,instructions=EXCLUDED.instructions",bank,beneficiary,iban,instructions==null?"":instructions);
 }
 public long requestPayment(long caseId,Long payerId,java.math.BigDecimal amount,String notes,Authentication a){
  var c=staffCase(caseId,a);
  var clients=jdbc.queryForList("SELECT client_id FROM case_clients WHERE case_id=?",Long.class,caseId);
  if(payerId==null&&clients.size()==1)payerId=clients.getFirst();
  if(payerId==null||!clients.contains(payerId))throw new BusinessRuleViolationException("Select the client responsible for this payment from the case participants");
  return jdbc.queryForObject("INSERT INTO payments(client_id,case_id,amount,type,status,notes) VALUES (?,?,?,'case_fee','pending',?) RETURNING id",Long.class,payerId,caseId,amount,notes);
 }
 public long requestGeneralPayment(long clientId,java.math.BigDecimal amount,String notes){
  one("SELECT id FROM clients WHERE id=?",clientId);
  return jdbc.queryForObject("INSERT INTO payments(client_id,amount,type,status,notes) VALUES (?,?,'other','pending',?) RETURNING id",Long.class,clientId,amount,notes);
 }
 public void submitReceipt(long paymentId,String reference,MultipartFile file,Authentication a)throws IOException{
  long clientId=clientId(a);
  var payment=one("SELECT status FROM payments WHERE id=? AND client_id=? FOR UPDATE",paymentId,clientId);
  if(!Set.of("pending","overdue").contains(payment.get("status")))throw new BusinessRuleViolationException("Payment is already paid or under review");
  long fileId=saveFile(file,clientId,null,paymentId,userId(a));
  jdbc.update("INSERT INTO payment_receipts(payment_id,file_id,reference,submitted_by) VALUES (?,?,?,?)",paymentId,fileId,reference,userId(a));
  jdbc.update("UPDATE payments SET status='under_review' WHERE id=?",paymentId);
 }
 public List<Map<String,Object>> pendingReceipts(){
  return jdbc.queryForList("SELECT pr.id,pr.payment_id,pr.file_id,pr.reference,pr.created_at,p.amount,p.case_id,c.name AS client_name,ca.case_number FROM payment_receipts pr JOIN payments p ON p.id=pr.payment_id JOIN clients c ON c.id=p.client_id LEFT JOIN cases ca ON ca.id=p.case_id WHERE pr.status='submitted' ORDER BY pr.created_at");
 }
 public void reviewReceipt(long receiptId,boolean approve,String notes,Authentication a){
  var receipt=one("SELECT payment_id,status FROM payment_receipts WHERE id=? FOR UPDATE",receiptId);
  if(!"submitted".equals(receipt.get("status")))throw new BusinessRuleViolationException("Receipt already reviewed");
  var payment=one("SELECT status FROM payments WHERE id=? FOR UPDATE",receipt.get("payment_id"));
  if(!"under_review".equals(payment.get("status")))throw new BusinessRuleViolationException("Payment is not awaiting review");
  jdbc.update("UPDATE payment_receipts SET status=?,reviewed_by=?,review_notes=?,reviewed_at=NOW() WHERE id=?",approve?"approved":"rejected",userId(a),notes,receiptId);
  jdbc.update("UPDATE payments SET status=?,paid_at=CASE WHEN ? THEN NOW() ELSE NULL END WHERE id=?",approve?"paid":"pending",approve,receipt.get("payment_id"));
 }
 public void addHearing(long caseId,java.time.OffsetDateTime datetime,String court,String type,Authentication a){
  var c=staffCase(caseId,a);
  jdbc.update("INSERT INTO hearings(case_id,datetime,court,type,assigned_lawyer,status) VALUES (?,?,?,?,?,'scheduled')",caseId,datetime,court,type,c.get("lead_lawyer_id"));
 }
}

