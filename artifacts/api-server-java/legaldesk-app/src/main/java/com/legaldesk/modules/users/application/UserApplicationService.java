package com.legaldesk.modules.users.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.users.api.CreateUserRequest;
import com.legaldesk.modules.users.api.UpdateUserRequest;
import com.legaldesk.modules.users.api.UserResponse;
import com.legaldesk.modules.users.domain.UserEntity;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import java.util.List;
import com.legaldesk.shared.security.ContactDetails;
import com.legaldesk.common.domain.BusinessRuleViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserApplicationService {

    @org.springframework.beans.factory.annotation.Autowired private com.legaldesk.modules.auth.application.AccountChangeMessages accountMessages;
    @org.springframework.beans.factory.annotation.Autowired private com.legaldesk.shared.security.CurrentUserFacade currentUser;
    @org.springframework.beans.factory.annotation.Autowired private org.springframework.jdbc.core.JdbcTemplate jdbc;
    @org.springframework.beans.factory.annotation.Autowired private com.legaldesk.modules.consultations.application.ConsultationContactLinker linker;
    private final UserEntityRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserApplicationService(UserEntityRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return repository.findAll().stream().filter(u->u.getDeletedAt()==null).map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long id) {
        return toResponse(findEntity(id));
    }

    public UserResponse create(CreateUserRequest request) {
        if (!java.util.Set.of("lawyer", "admin", "owner", "client").contains(request.role()))
            throw new com.legaldesk.common.domain.BusinessRuleViolationException("Invalid role");
        if("client".equals(request.role()))throw new BusinessRuleViolationException("Create client accounts from the client record");
        String identity=ContactDetails.identity(request.nationalId()),email=ContactDetails.email(request.email()),phone=ContactDetails.phone(request.phone());ContactDetails.requireContact(email,phone);
        if(repository.findByNationalId(identity).isPresent())throw new BusinessRuleViolationException("Identity number already exists");
        if(email!=null&&repository.findByEmailIgnoreCase(email).isPresent())throw new BusinessRuleViolationException("Email already exists");
        UserEntity entity = new UserEntity();entity.setNationalId(identity);
        entity.setName(request.name());entity.setEmail(email);entity.setAddress(request.address());
        entity.setMustChangePassword(true);
        entity.setPasswordHash(passwordEncoder.encode(request.password()));
        entity.setPhone(phone);
        entity.setRole(request.role());
        entity.setActive(true);
        return toResponse(repository.save(entity));
    }

    public UserResponse update(Long id, UpdateUserRequest request) {
        UserEntity entity = findEntity(id);
        String oldEmail=entity.getEmail(),oldPhone=entity.getPhone();
        if(id.equals(currentUser.currentUserIdOrNull())&&((request.nationalId()!=null&&!java.util.Objects.equals(request.nationalId(),entity.getNationalId()))||(request.name()!=null&&!java.util.Objects.equals(request.name(),entity.getName()))))throw new BusinessRuleViolationException("لا يمكنك تغيير اسمك أو رقم هويتك من حسابك الشخصي");
        String identity=request.nationalId()==null?entity.getNationalId():ContactDetails.identity(request.nationalId());
        String email=request.email()==null?entity.getEmail():ContactDetails.email(request.email());
        String phone=request.phone()==null?entity.getPhone():ContactDetails.phone(request.phone());
        String role=request.role()==null?entity.getRole():request.role();
        if(!java.util.Set.of("admin","owner","lawyer","client").contains(role)||(!role.equals(entity.getRole())&&("client".equals(role)||"client".equals(entity.getRole()))))throw new BusinessRuleViolationException("Invalid role change");
        if(!"client".equals(role))ContactDetails.requireContact(email,phone);
        if(identity!=null&&repository.findByNationalId(identity).filter(u->!u.getId().equals(id)).isPresent())throw new BusinessRuleViolationException("Identity number already exists");
        if(email!=null&&repository.findByEmailIgnoreCase(email).filter(u->!u.getId().equals(id)).isPresent())throw new BusinessRuleViolationException("Email already exists");
        entity.setNationalId(identity);entity.setEmail(email);entity.setPhone(phone);entity.setRole(role);
        if(request.name()!=null)entity.setName(request.name());
        if(request.active()!=null)entity.setActive(request.active());
        if(request.password()!=null&&!request.password().isBlank()){entity.setPasswordHash(passwordEncoder.encode(request.password()));entity.setMustChangePassword(true);}
        entity.setAuthVersion(entity.getAuthVersion()+1);
        if("client".equals(role)){
          jdbc.update("UPDATE clients SET national_id=?,email=?,phone=?,updated_at=NOW() WHERE user_id=?",identity,email,phone,id);
          var ids=jdbc.queryForList("SELECT id FROM clients WHERE user_id=?",Long.class,id);if(!ids.isEmpty())linker.link(ids.getFirst(),email,phone);
        }
        var saved=repository.saveAndFlush(entity);
        if(!java.util.Objects.equals(oldEmail,email))accountMessages.record(id,"تم تحديث بريد حسابك","تم تغيير البريد الإلكتروني من: "+java.util.Objects.toString(oldEmail,"غير مسجل")+"\nإلى: "+java.util.Objects.toString(email,"غير مسجل"),oldEmail,email);
        if(!java.util.Objects.equals(oldPhone,phone))accountMessages.record(id,"تم تحديث هاتف حسابك","تم تغيير رقم الهاتف من: "+java.util.Objects.toString(oldPhone,"غير مسجل")+"\nإلى: "+java.util.Objects.toString(phone,"غير مسجل"),oldEmail,email);
        if(request.password()!=null&&!request.password().isBlank())accountMessages.record(id,"تمت إعادة تعيين كلمة مرور حسابك","أعادت إدارة المكتب تعيين كلمة مرور حسابك. يجب تغيير الكلمة المؤقتة عند الدخول.",email);
        return toResponse(saved);
    }

    public void delete(Long id) {
        jdbc.queryForList("SELECT id FROM users WHERE id=? FOR UPDATE",id);
        var user=findEntity(id);
        if(id.equals(currentUser.currentUserIdOrNull()))throw new BusinessRuleViolationException("لا يمكنك حذف حسابك الحالي");
        if("lawyer".equals(user.getRole())){
            if(jdbc.queryForObject("SELECT count(*) FROM cases c WHERE c.lead_lawyer_id=? OR EXISTS(SELECT 1 FROM case_lawyers l WHERE l.case_id=c.id AND l.user_id=?)",Long.class,id,id)>0)throw new BusinessRuleViolationException("المحامي "+user.getName()+" مربوط على قضايا بالفعل ولا يمكن حذفه إلا بعد تعيين القضايا على محامٍ آخر أو رفعه منها");
            user.setActive(false);user.setDeletedAt(java.time.OffsetDateTime.now());user.setAuthVersion(user.getAuthVersion()+1);repository.saveAndFlush(user);
            jdbc.update("DELETE FROM push_subscriptions WHERE user_id=?",id);
        }else repository.delete(user);
    }

    private UserEntity findEntity(Long id) {
        return repository.findById(id).filter(u->u.getDeletedAt()==null).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private UserResponse toResponse(UserEntity entity) {
        return new UserResponse(
                entity.getId(),
                entity.getName(),
                entity.getNationalId(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getRole(),
                entity.getOfficeId(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),entity.getAddress()
        );
    }
}
