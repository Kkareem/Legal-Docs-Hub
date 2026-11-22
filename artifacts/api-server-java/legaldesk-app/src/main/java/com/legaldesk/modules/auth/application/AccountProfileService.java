package com.legaldesk.modules.auth.application;
import java.util.*;
import java.io.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;
import com.legaldesk.shared.security.*;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import com.legaldesk.modules.documents.application.AttachmentStorage;
import com.legaldesk.common.domain.*;

@Service
@Transactional(rollbackFor=Exception.class)
public class AccountProfileService {
 private final JdbcTemplate jdbc;private final UserEntityRepository users;private final PasswordEncoder encoder;private final AttachmentStorage storage;private final AccountChangeMessages messages;
 public AccountProfileService(JdbcTemplate jdbc,UserEntityRepository users,PasswordEncoder encoder,AttachmentStorage storage,AccountChangeMessages messages){this.jdbc=jdbc;this.users=users;this.encoder=encoder;this.storage=storage;this.messages=messages;}
 private long id(Authentication a){if(a==null||!(a.getPrincipal() instanceof AppUserPrincipal p))throw new org.springframework.security.authentication.BadCredentialsException("Not authenticated");return p.id();}
 public record Profile(long id,String name,String nationalId,String email,String phone,String role,String avatarUrl){}
 public Profile get(Authentication a){long id=id(a);var u=users.findById(id).orElseThrow(()->new NotFoundException("User not found"));var avatar=jdbc.queryForList("SELECT (extract(epoch FROM avatar_updated_at)*1000)::BIGINT AS version FROM user_profiles WHERE user_id=? AND avatar_key IS NOT NULL",id);String url=avatar.isEmpty()?null:"/api/account/avatar?v="+avatar.getFirst().get("version");return new Profile(id,u.getName(),u.getNationalId(),u.getEmail(),u.getPhone(),u.getRole(),url);}
 public Profile update(String email,String phone,String currentPassword,Authentication a){
  long id=id(a);jdbc.queryForList("SELECT id FROM users WHERE id=? FOR UPDATE",id);var u=users.findById(id).orElseThrow(()->new NotFoundException("User not found"));
  email=ContactDetails.email(email);phone=ContactDetails.phone(phone);ContactDetails.requireContact(email,phone);
  if(!u.isActive()||!encoder.matches(currentPassword,u.getPasswordHash()))throw new BusinessRuleViolationException("كلمة المرور الحالية غير صحيحة");
  if(email!=null&&users.findByEmailIgnoreCase(email).filter(other->!other.getId().equals(id)).isPresent())throw new BusinessRuleViolationException("البريد الإلكتروني مستخدم بحساب آخر");
  String oldEmail=u.getEmail(),oldPhone=u.getPhone();if(Objects.equals(email,oldEmail)&&Objects.equals(phone,oldPhone))return get(a);
  u.setEmail(email);u.setPhone(phone);users.saveAndFlush(u);
  jdbc.update("UPDATE clients SET email=?,phone=?,updated_at=NOW() WHERE user_id=?",email,phone,id);
  if(!Objects.equals(oldEmail,email))messages.record(id,"تم تغيير بريد حسابك","تم تغيير البريد الإلكتروني من: "+display(oldEmail)+"\nإلى: "+display(email),oldEmail,email);
  if(!Objects.equals(oldPhone,phone))messages.record(id,"تم تغيير رقم هاتف حسابك","تم تغيير رقم الهاتف من: "+display(oldPhone)+"\nإلى: "+display(phone),oldEmail,email);
  return get(a);
 }
 private String display(String value){return value==null||value.isBlank()?"غير مسجل":value;}
 public Profile avatar(MultipartFile file,Authentication a)throws IOException{
  if(file.isEmpty()||file.getSize()>5L*1024*1024)throw new BusinessRuleViolationException("الصورة يجب ألا تتجاوز 5 ميجابايت");
  BufferedImage image;
  try(var input=ImageIO.createImageInputStream(file.getInputStream())){
   var readers=ImageIO.getImageReaders(input);if(!readers.hasNext())throw new BusinessRuleViolationException("اختر صورة PNG أو JPEG");var reader=readers.next();
   try{String format=reader.getFormatName();if(!Set.of("png","JPEG","jpeg","PNG").contains(format))throw new BusinessRuleViolationException("اختر صورة PNG أو JPEG");reader.setInput(input);int w=reader.getWidth(0),h=reader.getHeight(0);if(w<1||h<1||w>4096||h>4096||((long)w*h)>16000000)throw new BusinessRuleViolationException("أبعاد الصورة يجب ألا تتجاوز 4096 × 4096");image=reader.read(0);}finally{reader.dispose();}
  }
  catch(IOException ex){throw new BusinessRuleViolationException("تعذر قراءة الصورة. اختر صورة PNG أو JPEG سليمة");}
  int width=image.getWidth(),height=image.getHeight();if(width>512||height>512){double ratio=Math.min(512.0/width,512.0/height);var scaled=new BufferedImage(Math.max(1,(int)(width*ratio)),Math.max(1,(int)(height*ratio)),BufferedImage.TYPE_INT_ARGB);var graphics=scaled.createGraphics();try{graphics.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION,java.awt.RenderingHints.VALUE_INTERPOLATION_BICUBIC);graphics.drawImage(image,0,0,scaled.getWidth(),scaled.getHeight(),null);}finally{graphics.dispose();}image=scaled;}
  long id=id(a);jdbc.queryForList("SELECT id FROM users WHERE id=? FOR UPDATE",id);
  var output=new ByteArrayOutputStream();ImageIO.write(image,"png",output);
  String key=storage.write(new ByteArrayInputStream(output.toByteArray()),"Profiles/user_"+id,"avatar.png");storage.cleanupOnRollback(key);
  var old=jdbc.queryForList("SELECT avatar_key FROM user_profiles WHERE user_id=? AND avatar_key IS NOT NULL",String.class,id);
  jdbc.update("INSERT INTO user_profiles(user_id,avatar_key,avatar_content_type,avatar_updated_at) VALUES(?,?,'image/png',NOW()) ON CONFLICT(user_id) DO UPDATE SET avatar_key=EXCLUDED.avatar_key,avatar_content_type='image/png',avatar_updated_at=NOW()",id,key);
  for(String previous:old)jdbc.update("INSERT INTO attachment_cleanup(storage_key) VALUES(?) ON CONFLICT DO NOTHING",previous);
  return get(a);
 }
 public byte[] avatarContent(Authentication a){var keys=jdbc.queryForList("SELECT avatar_key FROM user_profiles WHERE user_id=? AND avatar_key IS NOT NULL",String.class,id(a));if(keys.isEmpty())throw new NotFoundException("Profile picture not found");return storage.read(keys.getFirst());}
}
