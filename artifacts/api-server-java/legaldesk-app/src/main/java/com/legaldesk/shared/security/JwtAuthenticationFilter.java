package com.legaldesk.shared.security;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import com.legaldesk.modules.settings.application.SettingsService;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.net.URI;
import java.util.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
public class JwtAuthenticationFilter extends OncePerRequestFilter {
 public static final String COOKIE="legaldesk_access";
 private final JwtService jwt;private final UserEntityRepository users;private final SettingsService settings;
 public JwtAuthenticationFilter(JwtService jwt,UserEntityRepository users,SettingsService settings){this.jwt=jwt;this.users=users;this.settings=settings;}
 public static String token(HttpServletRequest req){String auth=req.getHeader("Authorization");if(auth!=null&&auth.startsWith("Bearer "))return auth.substring(7);if(req.getCookies()!=null)for(var c:req.getCookies())if(COOKIE.equals(c.getName()))return c.getValue();return null;}
 @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{
  // A JWT cookie is HttpOnly; browser write requests must also originate from this installation.
  String origin=req.getHeader("Origin");if(!Set.of("GET","HEAD","OPTIONS").contains(req.getMethod())&&origin!=null){try{URI incoming=URI.create(origin),configured=URI.create(settings.publicUrl());String own=req.getScheme()+"://"+req.getHeader("Host");String configuredOrigin=configured.getScheme()+"://"+configured.getRawAuthority();if(!origin.equals(own)&&!origin.equals(configuredOrigin)) {deny(res,403,"Invalid request origin");return;}}catch(IllegalArgumentException e){deny(res,403,"Invalid request origin");return;}}
  String token=token(req);if(token!=null){try{var claims=jwt.validate(token);var user=users.findById(Long.parseLong(claims.getSubject())).orElseThrow();if(!user.isActive()||claims.getClaimValue("version",Number.class).intValue()!=user.getAuthVersion())throw new IllegalArgumentException();var principal=AppUserPrincipal.from(user);SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal,null,principal.getAuthorities()));}catch(Exception e){SecurityContextHolder.clearContext();if(!req.getRequestURI().startsWith("/api/public/")&&!req.getRequestURI().equals("/api/auth/login")&&!req.getRequestURI().equals("/api/auth/logout")&&!req.getRequestURI().equals("/api/auth/forgot-password")&&!req.getRequestURI().equals("/api/auth/reset-password")){deny(res,401,"Session expired. Sign in again");return;}}}
  chain.doFilter(req,res);
 }
 private void deny(HttpServletResponse res,int status,String message)throws IOException{res.setStatus(status);res.setContentType("application/json");res.getWriter().write("{\"message\":\""+message+"\"}");}
}
