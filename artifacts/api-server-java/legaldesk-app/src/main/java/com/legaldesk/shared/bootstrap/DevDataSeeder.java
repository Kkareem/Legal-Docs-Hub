package com.legaldesk.shared.bootstrap;

import com.legaldesk.common.jpa.AuditedEntity;
import com.legaldesk.common.jpa.CreatedEntity;
import com.legaldesk.modules.audit.domain.AuditLogEntity;
import com.legaldesk.modules.audit.infrastructure.AuditLogEntityRepository;
import com.legaldesk.modules.cases.domain.CaseEntity;
import com.legaldesk.modules.cases.infrastructure.CaseEntityRepository;
import com.legaldesk.modules.clients.domain.ClientEntity;
import com.legaldesk.modules.clients.infrastructure.ClientEntityRepository;
import com.legaldesk.modules.consultations.domain.ConsultationEntity;
import com.legaldesk.modules.consultations.infrastructure.ConsultationEntityRepository;
import com.legaldesk.modules.documents.domain.DocumentEntity;
import com.legaldesk.modules.documents.infrastructure.DocumentEntityRepository;
import com.legaldesk.modules.hearings.domain.HearingEntity;
import com.legaldesk.modules.hearings.infrastructure.HearingEntityRepository;
import com.legaldesk.modules.notifications.domain.NotificationEntity;
import com.legaldesk.modules.notifications.infrastructure.NotificationEntityRepository;
import com.legaldesk.modules.payments.domain.PaymentEntity;
import com.legaldesk.modules.payments.infrastructure.PaymentEntityRepository;
import com.legaldesk.modules.poa.domain.PowerOfAttorneyEntity;
import com.legaldesk.modules.poa.infrastructure.PowerOfAttorneyEntityRepository;
import com.legaldesk.modules.tasks.domain.TaskEntity;
import com.legaldesk.modules.tasks.infrastructure.TaskEntityRepository;
import com.legaldesk.modules.users.domain.UserEntity;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
public class DevDataSeeder implements CommandLineRunner {
    private final UserEntityRepository userRepository;
    private final ClientEntityRepository clientRepository;
    private final CaseEntityRepository caseRepository;
    private final TaskEntityRepository taskRepository;
    private final HearingEntityRepository hearingRepository;
    private final ConsultationEntityRepository consultationRepository;
    private final PaymentEntityRepository paymentRepository;
    private final PowerOfAttorneyEntityRepository powerOfAttorneyRepository;
    private final DocumentEntityRepository documentRepository;
    private final NotificationEntityRepository notificationRepository;
    private final AuditLogEntityRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataSeeder(
            UserEntityRepository userRepository,
            ClientEntityRepository clientRepository,
            CaseEntityRepository caseRepository,
            TaskEntityRepository taskRepository,
            HearingEntityRepository hearingRepository,
            ConsultationEntityRepository consultationRepository,
            PaymentEntityRepository paymentRepository,
            PowerOfAttorneyEntityRepository powerOfAttorneyRepository,
            DocumentEntityRepository documentRepository,
            NotificationEntityRepository notificationRepository,
            AuditLogEntityRepository auditLogRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.caseRepository = caseRepository;
        this.taskRepository = taskRepository;
        this.hearingRepository = hearingRepository;
        this.consultationRepository = consultationRepository;
        this.paymentRepository = paymentRepository;
        this.powerOfAttorneyRepository = powerOfAttorneyRepository;
        this.documentRepository = documentRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();

        UserEntity owner = new UserEntity();
        owner.setName("Ahmed Al Mohamy");
        owner.setEmail("admin@legaldesk.sa");
        owner.setPasswordHash(passwordEncoder.encode("password123"));
        owner.setPhone("+966500000001");
        owner.setRole("owner");
        owner.setOfficeId(1L);
        owner.setActive(true);
        stamp(owner, now.minusDays(10));
        owner = userRepository.save(owner);

        UserEntity lawyer = new UserEntity();
        lawyer.setName("Sara Al Qahtani");
        lawyer.setEmail("sara@legaldesk.sa");
        lawyer.setPasswordHash(passwordEncoder.encode("password123"));
        lawyer.setPhone("+966500000002");
        lawyer.setRole("lawyer");
        lawyer.setOfficeId(1L);
        lawyer.setActive(true);
        stamp(lawyer, now.minusDays(9));
        lawyer = userRepository.save(lawyer);

        ClientEntity clientOne = new ClientEntity();
        clientOne.setName("Mohammed Al Harbi");
        clientOne.setPhone("+966501111111");
        clientOne.setEmail("m.harbi@example.com");
        clientOne.setNationalId("1010101010");
        clientOne.setAddress("Riyadh");
        clientOne.setOfficeId(1L);
        clientOne.setStatus("active");
        clientOne.setServiceType("Commercial Litigation");
        clientOne.setNotes("VIP client");
        clientOne.setUserId(owner.getId());
        stamp(clientOne, now.minusDays(8));
        clientOne = clientRepository.save(clientOne);

        ClientEntity clientTwo = new ClientEntity();
        clientTwo.setName("Noura Al Dosari");
        clientTwo.setPhone("+966502222222");
        clientTwo.setEmail("noura@example.com");
        clientTwo.setNationalId("2020202020");
        clientTwo.setAddress("Jeddah");
        clientTwo.setOfficeId(1L);
        clientTwo.setStatus("new");
        clientTwo.setServiceType("Family Case");
        clientTwo.setUserId(lawyer.getId());
        stamp(clientTwo, now.minusDays(7));
        clientTwo = clientRepository.save(clientTwo);

        CaseEntity caseOne = new CaseEntity();
        caseOne.setCaseNumber("LD-2026-001");
        caseOne.setCourtCaseNumber("R-4451");
        caseOne.setType("commercial");
        caseOne.setCourt("Riyadh Commercial Court");
        caseOne.setDivision("Second Division");
        caseOne.setClientId(clientOne.getId());
        caseOne.setLeadLawyerId(owner.getId());
        caseOne.setStatus("active");
        caseOne.setOpposingParty("Al Noor Trading");
        caseOne.setDescription("Contract breach dispute");
        caseOne.setOfficeId(1L);
        stamp(caseOne, now.minusDays(6));
        caseOne = caseRepository.save(caseOne);

        CaseEntity caseTwo = new CaseEntity();
        caseTwo.setCaseNumber("LD-2026-002");
        caseTwo.setCourtCaseNumber("J-7782");
        caseTwo.setType("family");
        caseTwo.setCourt("Jeddah Family Court");
        caseTwo.setDivision("First Division");
        caseTwo.setClientId(clientTwo.getId());
        caseTwo.setLeadLawyerId(lawyer.getId());
        caseTwo.setStatus("upcoming_hearing");
        caseTwo.setOpposingParty("Private");
        caseTwo.setDescription("Custody arrangement");
        caseTwo.setOfficeId(1L);
        stamp(caseTwo, now.minusDays(5));
        caseTwo = caseRepository.save(caseTwo);

        TaskEntity taskOne = new TaskEntity();
        taskOne.setTitle("Prepare contract evidence file");
        taskOne.setDescription("Collect signed emails and annexes");
        taskOne.setCaseId(caseOne.getId());
        taskOne.setAssignedTo(owner.getId());
        taskOne.setDueDate(now.minusDays(1));
        taskOne.setPriority("high");
        taskOne.setStatus("in_progress");
        taskOne.setOfficeId(1L);
        stamp(taskOne, now.minusDays(2));
        taskRepository.save(taskOne);

        TaskEntity taskTwo = new TaskEntity();
        taskTwo.setTitle("Call client before hearing");
        taskTwo.setDescription("Confirm witness availability");
        taskTwo.setCaseId(caseTwo.getId());
        taskTwo.setAssignedTo(lawyer.getId());
        taskTwo.setDueDate(now.plusDays(2));
        taskTwo.setPriority("medium");
        taskTwo.setStatus("new");
        taskTwo.setOfficeId(1L);
        stamp(taskTwo, now.minusDays(1));
        taskRepository.save(taskTwo);

        HearingEntity hearingOne = new HearingEntity();
        hearingOne.setCaseId(caseTwo.getId());
        hearingOne.setDatetime(now.plusDays(1));
        hearingOne.setCourt("Jeddah Family Court");
        hearingOne.setType("session");
        hearingOne.setAssignedLawyer(lawyer.getId());
        hearingOne.setStatus("scheduled");
        hearingOne.setNotes("Bring reconciliation documents");
        stampCreated(hearingOne, now.minusHours(18));
        hearingRepository.save(hearingOne);

        HearingEntity hearingTwo = new HearingEntity();
        hearingTwo.setCaseId(caseOne.getId());
        hearingTwo.setDatetime(now.plusDays(4));
        hearingTwo.setCourt("Riyadh Commercial Court");
        hearingTwo.setType("review");
        hearingTwo.setAssignedLawyer(owner.getId());
        hearingTwo.setStatus("scheduled");
        stampCreated(hearingTwo, now.minusHours(12));
        hearingRepository.save(hearingTwo);

        ConsultationEntity consultation = new ConsultationEntity();
        consultation.setClientId(clientTwo.getId());
        consultation.setSummary("Initial custody and visitation consultation");
        consultation.setPaymentStatus("pending");
        consultation.setFee(new BigDecimal("1500.00"));
        consultation.setStatus("pending");
        consultation.setAssignedTo(lawyer.getId());
        stamp(consultation, now.minusDays(3));
        consultationRepository.save(consultation);

        PaymentEntity paidPayment = new PaymentEntity();
        paidPayment.setClientId(clientOne.getId());
        paidPayment.setCaseId(caseOne.getId());
        paidPayment.setAmount(new BigDecimal("25000.00"));
        paidPayment.setType("case_fee");
        paidPayment.setStatus("paid");
        paidPayment.setPaidAt(now.minusDays(3));
        paidPayment.setNotes("Advance retainer");
        stampCreated(paidPayment, now.minusDays(3));
        paymentRepository.save(paidPayment);

        PaymentEntity pendingPayment = new PaymentEntity();
        pendingPayment.setClientId(clientOne.getId());
        pendingPayment.setCaseId(caseOne.getId());
        pendingPayment.setAmount(new BigDecimal("12000.00"));
        pendingPayment.setType("hearing_fee");
        pendingPayment.setStatus("pending");
        pendingPayment.setNotes("Pending before next hearing");
        stampCreated(pendingPayment, now.minusDays(2));
        paymentRepository.save(pendingPayment);

        PaymentEntity overduePayment = new PaymentEntity();
        overduePayment.setClientId(clientTwo.getId());
        overduePayment.setCaseId(caseTwo.getId());
        overduePayment.setAmount(new BigDecimal("8000.00"));
        overduePayment.setType("consultation");
        overduePayment.setStatus("overdue");
        overduePayment.setNotes("Past due follow-up");
        stampCreated(overduePayment, now.minusDays(1));
        paymentRepository.save(overduePayment);

        PowerOfAttorneyEntity poa = new PowerOfAttorneyEntity();
        poa.setClientId(clientOne.getId());
        poa.setCaseId(caseOne.getId());
        poa.setReceivedBy(owner.getId());
        poa.setHandedBy("Client Representative");
        poa.setReceivedAt(now.minusDays(10));
        poa.setReturnBy(now.minusDays(2));
        poa.setStatus("with_lawyer");
        poa.setNotes("Original copy currently with lead lawyer");
        stampCreated(poa, now.minusDays(10));
        powerOfAttorneyRepository.save(poa);

        DocumentEntity document = new DocumentEntity();
        document.setCaseId(caseOne.getId());
        document.setClientId(clientOne.getId());
        document.setFileUrl("https://example.com/contracts/ld-2026-001.pdf");
        document.setFileName("Contract Evidence Pack.pdf");
        document.setDocType("contract");
        document.setOriginal(true);
        document.setUploadedBy(owner.getId());
        document.setNotes("Scanned and verified");
        stampCreated(document, now.minusDays(2));
        documentRepository.save(document);

        NotificationEntity notification = new NotificationEntity();
        notification.setUserId(owner.getId());
        notification.setType("task");
        notification.setTitle("Overdue task reminder");
        notification.setBody("Prepare contract evidence file is overdue.");
        notification.setRead(false);
        notification.setRefId(caseOne.getId());
        notification.setRefType("case");
        stampCreated(notification, now.minusHours(6));
        notificationRepository.save(notification);

        auditLogRepository.save(audit(owner.getId(), "created", "client", clientOne.getId(), "Client Mohammed Al Harbi created"));
        auditLogRepository.save(audit(owner.getId(), "created", "case", caseOne.getId(), "Commercial litigation case opened"));
        auditLogRepository.save(audit(lawyer.getId(), "scheduled", "hearing", caseTwo.getId(), "Family court hearing scheduled"));
        auditLogRepository.save(audit(owner.getId(), "uploaded", "document", document.getId(), "Evidence pack uploaded"));
    }

    private AuditLogEntity audit(Long userId, String action, String entity, Long entityId, String newValue) {
        AuditLogEntity log = new AuditLogEntity();
        log.setUserId(userId);
        log.setAction(action);
        log.setEntity(entity);
        log.setEntityId(entityId);
        log.setNewVal(newValue);
        stampCreated(log, OffsetDateTime.now().minusHours(3));
        return log;
    }

    private void stamp(AuditedEntity entity, OffsetDateTime at) {
        entity.setCreatedAt(at);
        entity.setUpdatedAt(at);
    }

    private void stampCreated(CreatedEntity entity, OffsetDateTime at) {
        entity.setCreatedAt(at);
    }
}
