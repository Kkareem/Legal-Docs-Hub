package com.legaldesk.modules.cases.application;
import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.shared.security.CurrentUserFacade;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
@Service
public class CaseAccessService {
 private final JdbcTemplate jdbc;private final CurrentUserFacade current;
 public CaseAccessService(JdbcTemplate jdbc,CurrentUserFacade current){this.jdbc=jdbc;this.current=current;}
 public boolean admin(){return jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id=? AND active AND role IN ('admin','owner')",Long.class,current.currentUserId())>0;}
 public boolean allowed(Long id){return admin()||jdbc.queryForObject("SELECT COUNT(*) FROM case_lawyers WHERE case_id=? AND user_id=?",Long.class,id,current.currentUserId())>0;}
 public void require(Long id){if(id==null||!allowed(id)||jdbc.queryForObject("SELECT COUNT(*) FROM cases WHERE id=?",Long.class,id)==0)throw new NotFoundException("Case not found");}
}
