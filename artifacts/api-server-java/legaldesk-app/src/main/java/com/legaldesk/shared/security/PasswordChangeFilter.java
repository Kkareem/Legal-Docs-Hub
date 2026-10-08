package com.legaldesk.shared.security;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
public class PasswordChangeFilter extends OncePerRequestFilter {
 private final UserEntityRepository users;
 public PasswordChangeFilter(UserEntityRepository users) { this.users=users; }
 @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
  var auth=SecurityContextHolder.getContext().getAuthentication();
  if (req.getRequestURI().startsWith("/api/") && !req.getRequestURI().startsWith("/api/auth/") && auth!=null && auth.getPrincipal() instanceof AppUserPrincipal p) {
   var user=users.findById(p.id()).orElse(null);
   if(user==null || !user.isActive() || user.isMustChangePassword()) {
    res.setStatus(403); res.setContentType("application/json");
    res.getWriter().write("{\"message\":\"Password change required or account disabled\"}"); return;
   }
  }
  chain.doFilter(req,res);
 }
}

