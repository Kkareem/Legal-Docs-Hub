package com.legaldesk.modules.clients.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.cases.infrastructure.CaseEntityRepository;
import com.legaldesk.modules.clients.api.ClientResponse;
import com.legaldesk.modules.clients.api.ClientSummaryResponse;
import com.legaldesk.modules.clients.api.CreateClientRequest;
import com.legaldesk.modules.clients.api.UpdateClientRequest;
import com.legaldesk.modules.clients.domain.ClientEntity;
import com.legaldesk.modules.clients.infrastructure.ClientEntityRepository;
import com.legaldesk.modules.payments.infrastructure.PaymentEntityRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ClientApplicationService {

    private final ClientEntityRepository repository;
    private final CaseEntityRepository caseRepository;
    private final PaymentEntityRepository paymentRepository;

    public ClientApplicationService(
            ClientEntityRepository repository,
            CaseEntityRepository caseRepository,
            PaymentEntityRepository paymentRepository
    ) {
        this.repository = repository;
        this.caseRepository = caseRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> list(String status, String search) {
        return repository.findAllByOrderByNameAsc().stream()
                .filter(entity -> status == null || status.equals(entity.getStatus()))
                .filter(entity -> search == null || search.isBlank()
                        || entity.getName().toLowerCase().contains(search.toLowerCase())
                        || (entity.getPhone() != null && entity.getPhone().contains(search)))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientResponse get(Long id) {
        return toResponse(findEntity(id));
    }

    public ClientResponse create(CreateClientRequest request) {
        ClientEntity entity = new ClientEntity();
        apply(entity, request.name(), request.phone(), request.email(), request.nationalId(), request.address(),
                request.status(), request.serviceType(), request.notes(), request.userId());
        return toResponse(repository.save(entity));
    }

    public ClientResponse update(Long id, UpdateClientRequest request) {
        ClientEntity entity = findEntity(id);
        apply(entity,
                request.name() != null ? request.name() : entity.getName(),
                request.phone() != null ? request.phone() : entity.getPhone(),
                request.email() != null ? request.email() : entity.getEmail(),
                request.nationalId() != null ? request.nationalId() : entity.getNationalId(),
                request.address() != null ? request.address() : entity.getAddress(),
                request.status() != null ? request.status() : entity.getStatus(),
                request.serviceType() != null ? request.serviceType() : entity.getServiceType(),
                request.notes() != null ? request.notes() : entity.getNotes(),
                request.userId() != null ? request.userId() : entity.getUserId());
        return toResponse(repository.save(entity));
    }

    public void delete(Long id) {
        repository.delete(findEntity(id));
    }

    @Transactional(readOnly = true)
    public ClientSummaryResponse summary(Long id) {
        findEntity(id);
        var cases = caseRepository.findByClientId(id);
        var payments = paymentRepository.findByClientId(id);
        BigDecimal totalPaid = payments.stream()
                .filter(payment -> "paid".equals(payment.getStatus()))
                .map(payment -> payment.getAmount() == null ? BigDecimal.ZERO : payment.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDue = payments.stream()
                .filter(payment -> "pending".equals(payment.getStatus()) || "overdue".equals(payment.getStatus()))
                .map(payment -> payment.getAmount() == null ? BigDecimal.ZERO : payment.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long activeCases = cases.stream().filter(c -> "active".equals(c.getStatus()) || "upcoming_hearing".equals(c.getStatus())).count();
        return new ClientSummaryResponse(id, totalPaid, totalDue, activeCases, cases.size(), 0);
    }

    private ClientEntity findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Client not found"));
    }

    private void apply(ClientEntity entity, String name, String phone, String email, String nationalId,
                       String address, String status, String serviceType, String notes, Long userId) {
        entity.setName(name);
        entity.setPhone(phone);
        entity.setEmail(email);
        entity.setNationalId(nationalId);
        entity.setAddress(address);
        entity.setStatus(status != null ? status : "new");
        entity.setServiceType(serviceType);
        entity.setNotes(notes);
        entity.setUserId(userId);
    }

    private ClientResponse toResponse(ClientEntity entity) {
        return new ClientResponse(entity.getId(), entity.getName(), entity.getPhone(), entity.getEmail(),
                entity.getNationalId(), entity.getAddress(), entity.getOfficeId(), entity.getStatus(),
                entity.getServiceType(), entity.getNotes(), entity.getUserId(), entity.getCreatedAt(), entity.getUpdatedAt());
    }
}
