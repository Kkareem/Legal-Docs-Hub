package com.legaldesk.modules.consultations.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
@Service
public class ConsultationContactLinker {
 private final JdbcTemplate jdbc;
 public ConsultationContactLinker(JdbcTemplate jdbc){this.jdbc=jdbc;}
 public static final String EMAIL="lower(trim(email))";
 public static final String PHONE="regexp_replace(regexp_replace(trim(phone),'^00','+'),'[ ()-]','','g')";
 @Transactional public void link(long clientId,String email,String phone){
  // A shared contact must never merge two clients' legal conversations.
  if(email!=null&&owners(email,null).stream().allMatch(id->id==clientId))jdbc.update("UPDATE consultation_requests SET client_id=?,updated_at=NOW() WHERE client_id IS NULL AND "+EMAIL+"=?",clientId,email);
  if(phone!=null&&owners(null,phone).stream().allMatch(id->id==clientId))jdbc.update("UPDATE consultation_requests SET client_id=?,updated_at=NOW() WHERE client_id IS NULL AND "+PHONE+"=?",clientId,phone);
 }
 public Long find(String email,String phone){var ids=owners(email,phone);return ids.size()==1?ids.getFirst():null;}
 private List<Long> owners(String email,String phone){return jdbc.queryForList("SELECT id FROM clients WHERE user_id IS NOT NULL AND ((CAST(? AS TEXT) IS NOT NULL AND "+EMAIL+"=?) OR (CAST(? AS TEXT) IS NOT NULL AND "+PHONE+"=?))",Long.class,email,email,phone,phone);}
}
