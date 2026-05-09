package com.legaldesk.modules.clients.infrastructure;

import com.legaldesk.modules.clients.domain.ClientEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientEntityRepository extends JpaRepository<ClientEntity, Long> {
    List<ClientEntity> findByStatusOrderByNameAsc(String status);
    List<ClientEntity> findAllByOrderByNameAsc();
}
