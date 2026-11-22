package com.legaldesk.modules.users.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import com.legaldesk.common.domain.*;
import com.legaldesk.modules.settings.application.SettingsService;
import com.legaldesk.modules.auth.application.AccountChangeMessages;

@Service
@Transactional
public class LawyerCaseService {
 private final JdbcTemplate jdbc;private final SettingsService settings;private final AccountChangeMessages messages;
 public LawyerCaseService(JdbcTemplate jdbc,SettingsService settings,AccountChangeMessages messages){this.jdbc=jdbc;this.settings=settings;this.messages=messages;}
 private Map<String,Object> lawyer(long id){var rows=jdbc.queryForList("SELECT id,name,email,phone,address,national_id,active FROM users WHERE id=? AND role='lawyer' AND deleted_at IS NULL",id);if(rows.isEmpty())throw new NotFoundException("Lawyer not found");return rows.getFirst();}
 public List<Map<String,Object>> cases(long id){lawyer(id);var cases=jdbc.queryForList("SELECT c.id,c.case_number,c.type,c.court,COALESCE(NULLIF(c.title,''),NULLIF(c.description,''),'قضية '||c.case_number) AS title FROM cases c WHERE c.lead_lawyer_id=? OR EXISTS(SELECT 1 FROM case_lawyers l WHERE l.case_id=c.id AND l.user_id=?) ORDER BY c.created_at DESC",id,id);for(var c:cases)c.put("other_lawyers",jdbc.queryForList("SELECT u.id,u.name FROM case_lawyers l JOIN users u ON u.id=l.user_id WHERE l.case_id=? AND u.id<>? ORDER BY u.name",c.get("id"),id));return cases;}
 public Map<String,Object> details(long id){return Map.of("lawyer",lawyer(id),"cases",cases(id));}
 public void reassign(long lawyerId,long caseId,Long replacement){
  var source=lawyer(lawyerId);
  var rows=jdbc.queryForList("SELECT id,lead_lawyer_id,case_number,type FROM cases WHERE id=? FOR UPDATE",caseId);if(rows.isEmpty())throw new NotFoundException("Case not found");var c=rows.getFirst();
  if(jdbc.queryForObject("SELECT count(*) FROM case_lawyers WHERE case_id=? AND user_id=?",Long.class,caseId,lawyerId)==0&&!Objects.equals(c.get("lead_lawyer_id"),lawyerId))throw new BusinessRuleViolationException("المحامي لم يعد مرتبطًا بهذه القضية. حدّث الصفحة.");
  if(replacement!=null&&replacement==lawyerId)throw new BusinessRuleViolationException("اختر محاميًا آخر");
  Map<String,Object> target=null;
  if(replacement!=null){var found=jdbc.queryForList("SELECT id,email,name FROM users WHERE id=? AND active AND deleted_at IS NULL AND role IN('lawyer','admin','owner') FOR KEY SHARE",replacement);if(found.isEmpty())throw new BusinessRuleViolationException("المحامي المختار غير متاح للتعيين");target=found.getFirst();}
  Long lead=c.get("lead_lawyer_id")==null?null:((Number)c.get("lead_lawyer_id")).longValue();
  if(Objects.equals(lead,lawyerId)){
   if(replacement!=null)lead=replacement;
   else {var remaining=jdbc.queryForList("SELECT l.user_id FROM case_lawyers l JOIN users u ON u.id=l.user_id WHERE l.case_id=? AND l.user_id<>? AND u.active AND u.deleted_at IS NULL ORDER BY l.user_id LIMIT 1",Long.class,caseId,lawyerId);lead=remaining.isEmpty()?null:remaining.getFirst();}
   jdbc.update("UPDATE cases SET lead_lawyer_id=?,updated_at=NOW() WHERE id=?",lead,caseId);
  }else jdbc.update("UPDATE cases SET updated_at=NOW() WHERE id=?",caseId);
  jdbc.update("DELETE FROM case_lawyers WHERE case_id=? AND user_id=?",caseId,lawyerId);
  if(replacement!=null)jdbc.update("INSERT INTO case_lawyers(case_id,user_id) VALUES(?,?) ON CONFLICT DO NOTHING",caseId,replacement);
  jdbc.update("UPDATE hearings SET assigned_lawyer=? WHERE case_id=? AND assigned_lawyer=? AND status NOT IN('completed','done','cancelled')",replacement,caseId,lawyerId);
  jdbc.update("UPDATE tasks SET assigned_to=?,updated_at=NOW() WHERE case_id=? AND assigned_to=? AND status NOT IN('completed','done','cancelled')",replacement,caseId,lawyerId);
  String number=c.get("case_number").toString(),type=type(c.get("type").toString());
  messages.recordCase(lawyerId,caseId,true,"تم رفعك من محامي القضية","تم رفعك من قائمة المحامين على القضية رقم "+number+" نوعها "+type+".",(String)source.get("email"));
  if(target!=null){String path="/case-workspace/"+caseId;messages.recordCase(replacement,caseId,false,"تم تعيين قضية إليك","تم تعيين القضية رقم "+number+" نوعها "+type+" إليك.\nللاطلاع عليها يرجى التوجه إلى المنصة: "+settings.publicUrl()+path+"\nالمسار: القضايا ← ملف القضية رقم "+number+"\n"+path,(String)target.get("email"));}
 }
 private String type(String value){return Map.of("civil","مدني","criminal","جنائي","commercial","تجاري","family","أسري","labor","عمالي","administrative","إداري","other","أخرى").getOrDefault(value,value);}
}
