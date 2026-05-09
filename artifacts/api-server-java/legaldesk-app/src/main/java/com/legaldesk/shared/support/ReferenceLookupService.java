package com.legaldesk.shared.support;

import com.legaldesk.modules.cases.infrastructure.CaseEntityRepository;
import com.legaldesk.modules.clients.infrastructure.ClientEntityRepository;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import java.util.Map;
import java.util.function.Function;
import org.springframework.stereotype.Service;

@Service
public class ReferenceLookupService {

    private final ClientEntityRepository clientRepository;
    private final UserEntityRepository userRepository;
    private final CaseEntityRepository caseRepository;

    public ReferenceLookupService(
            ClientEntityRepository clientRepository,
            UserEntityRepository userRepository,
            CaseEntityRepository caseRepository
    ) {
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.caseRepository = caseRepository;
    }

    public Map<Long, String> clientNames() {
        return clientRepository.findAll()
                .stream()
                .collect(java.util.stream.Collectors.toMap(entity -> entity.getId(), entity -> entity.getName()));
    }

    public Map<Long, String> userNames() {
        return userRepository.findAll()
                .stream()
                .collect(java.util.stream.Collectors.toMap(entity -> entity.getId(), entity -> entity.getName()));
    }

    public Map<Long, String> caseNumbers() {
        return caseRepository.findAll()
                .stream()
                .collect(java.util.stream.Collectors.toMap(entity -> entity.getId(), entity -> entity.getCaseNumber()));
    }

    public <T> String get(Map<Long, String> map, T value) {
        if (!(value instanceof Long id)) {
            return null;
        }
        return map.get(id);
    }
}
