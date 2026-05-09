package com.legaldesk.modules.users.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.users.api.CreateUserRequest;
import com.legaldesk.modules.users.api.UpdateUserRequest;
import com.legaldesk.modules.users.api.UserResponse;
import com.legaldesk.modules.users.domain.UserEntity;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserApplicationService {

    private final UserEntityRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserApplicationService(UserEntityRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long id) {
        return toResponse(findEntity(id));
    }

    public UserResponse create(CreateUserRequest request) {
        UserEntity entity = new UserEntity();
        entity.setName(request.name());
        entity.setEmail(request.email());
        entity.setPasswordHash(passwordEncoder.encode(request.password()));
        entity.setPhone(request.phone());
        entity.setRole(request.role());
        entity.setActive(true);
        return toResponse(repository.save(entity));
    }

    public UserResponse update(Long id, UpdateUserRequest request) {
        UserEntity entity = findEntity(id);
        if (request.name() != null) entity.setName(request.name());
        if (request.phone() != null) entity.setPhone(request.phone());
        if (request.role() != null) entity.setRole(request.role());
        if (request.active() != null) entity.setActive(request.active());
        if (request.password() != null && !request.password().isBlank()) {
            entity.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return toResponse(repository.save(entity));
    }

    public void delete(Long id) {
        repository.delete(findEntity(id));
    }

    private UserEntity findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private UserResponse toResponse(UserEntity entity) {
        return new UserResponse(
                entity.getId(),
                entity.getName(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getRole(),
                entity.getOfficeId(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
