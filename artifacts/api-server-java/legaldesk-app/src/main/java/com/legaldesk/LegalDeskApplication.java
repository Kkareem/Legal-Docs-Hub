package com.legaldesk;

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
import com.legaldesk.shared.security.SecurityConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.legaldesk")
@EntityScan(basePackageClasses = {
        UserEntity.class,
        ClientEntity.class,
        CaseEntity.class,
        DocumentEntity.class,
        TaskEntity.class,
        HearingEntity.class,
        ConsultationEntity.class,
        PaymentEntity.class,
        PowerOfAttorneyEntity.class,
        NotificationEntity.class,
        AuditLogEntity.class
})
@EnableJpaRepositories(basePackageClasses = {
        UserEntityRepository.class,
        ClientEntityRepository.class,
        CaseEntityRepository.class,
        DocumentEntityRepository.class,
        TaskEntityRepository.class,
        HearingEntityRepository.class,
        ConsultationEntityRepository.class,
        PaymentEntityRepository.class,
        PowerOfAttorneyEntityRepository.class,
        NotificationEntityRepository.class,
        AuditLogEntityRepository.class
})
@Import(SecurityConfig.class)
public class LegalDeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(LegalDeskApplication.class, args);
    }
}
