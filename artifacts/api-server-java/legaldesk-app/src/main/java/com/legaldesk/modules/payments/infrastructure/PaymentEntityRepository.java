package com.legaldesk.modules.payments.infrastructure;

import com.legaldesk.modules.payments.domain.PaymentEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentEntityRepository extends JpaRepository<PaymentEntity, Long> {
    List<PaymentEntity> findAllByOrderByCreatedAtAsc();
    List<PaymentEntity> findByClientId(Long clientId);
}
