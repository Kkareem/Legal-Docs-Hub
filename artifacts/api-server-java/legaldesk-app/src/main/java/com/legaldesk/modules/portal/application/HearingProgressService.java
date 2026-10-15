package com.legaldesk.modules.portal.application;

import com.legaldesk.common.domain.BusinessRuleViolationException;
import java.util.*;
import java.time.OffsetDateTime;
import java.io.IOException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional(rollbackFor=Exception.class)
public class HearingProgressService {
 private final ClientPortalService portal;
 private final org.springframework.jdbc.core.JdbcTemplate jdbc;
 public HearingProgressService(ClientPortalService portal,org.springframework.jdbc.core.JdbcTemplate jdbc){this.portal=portal;this.jdbc=jdbc;}
 public record Request(Long clientId,String title,String details,String kind,Long targetHearingId,OffsetDateTime dueAt){}
 public void report(long caseId,long hearingId,String body,List<Request> requests,Authentication a){
  portal.staffCase(caseId,a);
  portal.one("SELECT id FROM hearings WHERE id=? AND case_id=? FOR UPDATE",hearingId,caseId);
  if(body==null||body.isBlank()||body.length()>10000||requests==null||requests.size()>20)throw new BusinessRuleViolationException("Invalid hearing report");
  for(var r:requests){
   if(r==null||r.clientId()==null||r.title()==null||r.title().isBlank()||r.title().length()>200||r.details()==null||r.details().isBlank()||r.details().length()>10000||!Set.of("document","other").contains(Objects.toString(r.kind(),"")))throw new BusinessRuleViolationException("Provide request title, details, type and responsible client");
   portal.one("SELECT client_id FROM case_clients WHERE case_id=? AND client_id=?",caseId,r.clientId());
   if(r.targetHearingId()!=null)portal.one("SELECT id FROM hearings WHERE case_id=? AND id=?",caseId,r.targetHearingId());
  }
  long report=jdbc.queryForObject("INSERT INTO hearing_reports(case_id,hearing_id,body,created_by) VALUES(?,?,?,?) RETURNING id",Long.class,caseId,hearingId,body.trim(),portal.userId(a));
  for(var r:requests)jdbc.update("INSERT INTO case_client_requests(case_id,hearing_id,report_id,client_id,title,details,kind,target_hearing_id,due_at) VALUES(?,?,?,?,?,?,?,?,?)",caseId,hearingId,report,r.clientId(),r.title().trim(),r.details().trim(),r.kind(),r.targetHearingId(),r.dueAt());
  jdbc.update("UPDATE hearings SET status='completed' WHERE id=?",hearingId);
  jdbc.queryForList("SELECT notify_case_people(?,'case','تحديث جلسة',?)",caseId,"تم تسجيل ما حدث في الجلسة وإضافة تفاصيلها.");
 }
 public void complete(long caseId,long requestId,String notes,MultipartFile[] files,Authentication a)throws IOException{
  portal.clientCase(caseId,a);long client=portal.clientId(a);
  var r=portal.one("SELECT * FROM case_client_requests WHERE id=? AND case_id=? AND client_id=? FOR UPDATE",requestId,caseId,client);
  if(!"pending".equals(r.get("status")))throw new BusinessRuleViolationException("Request already completed");
  if(notes==null||notes.isBlank()||notes.length()>10000)throw new BusinessRuleViolationException("Completion details are required");
  if(files.length>10||("document".equals(r.get("kind"))&&files.length==0))throw new BusinessRuleViolationException("Document request requires attachments (max 10)");
  long total=0;for(var file:files){portal.validateFile(file);total+=file.getSize();}
  if(total>50L*1024*1024)throw new BusinessRuleViolationException("Total upload exceeds 50 MB");
  for(var file:files){long id=portal.saveFile(file,client,caseId,null,portal.userId(a));jdbc.update("UPDATE documents SET client_request_id=? WHERE id=?",requestId,id);}
  jdbc.update("UPDATE case_client_requests SET status='completed',completion_notes=?,completed_by=?,completed_at=NOW() WHERE id=?",notes.trim(),portal.userId(a),requestId);
 }
}
