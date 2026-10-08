package com.legaldesk.modules.cases.application;

import com.legaldesk.common.domain.NotFoundException;
import com.legaldesk.modules.cases.api.CaseResponse;
import com.legaldesk.modules.cases.api.CreateCaseRequest;
import com.legaldesk.modules.cases.api.UpdateCaseRequest;
import com.legaldesk.modules.cases.domain.CaseEntity;
import com.legaldesk.modules.cases.infrastructure.CaseEntityRepository;
import com.legaldesk.shared.support.ReferenceLookupService;
import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import com.legaldesk.common.domain.BusinessRuleViolationException;
import com.legaldesk.shared.security.CurrentUserFacade;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CaseApplicationService {

    private final CaseEntityRepository repository;
    private final JdbcTemplate jdbc;
    private final CaseAccessService access;
    private final CurrentUserFacade current;
    private final ReferenceLookupService referenceLookupService;

    public CaseApplicationService(CaseEntityRepository repository, ReferenceLookupService referenceLookupService,JdbcTemplate jdbc,CaseAccessService access,CurrentUserFacade current) {
        this.repository = repository;this.jdbc=jdbc;this.access=access;this.current=current;
        this.referenceLookupService = referenceLookupService;
    }

    @Transactional(readOnly = true)
    public List<CaseResponse> list(String status, String type, Long lawyerId, Long clientId, String search) {
        return enrich(repository.findAllByOrderByCreatedAtAsc()).stream()
                .filter(c -> access.allowed(c.id()))
                .filter(c -> status == null || status.equals(c.status()))
                .filter(c -> type == null || type.equals(c.type()))
                .filter(c -> lawyerId == null || c.lawyers().stream().anyMatch(m->lawyerId.equals(m.get("id"))))
                .filter(c -> clientId == null || c.clients().stream().anyMatch(m->clientId.equals(m.get("id"))))
                .filter(c -> search == null || search.isBlank()
                        || c.caseNumber().toLowerCase().contains(search.toLowerCase())
                        || (c.court() != null && c.court().toLowerCase().contains(search.toLowerCase())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CaseResponse get(Long id) {
        access.require(id);
        return enrichOne(findEntity(id));
    }

    public CaseResponse create(CreateCaseRequest request) {
        List<Long> clients=clientIds(request.clientIds(),request.clientId());
        List<Long> lawyers=lawyerIds(request.lawyerIds(),request.leadLawyerId());
        if(!access.admin()&&!lawyers.contains(current.currentUserId()))lawyers.add(current.currentUserId());
        validateMembers(clients,lawyers);
        CaseEntity entity = new CaseEntity();
        apply(entity, request.caseNumber(), request.courtCaseNumber(), request.type(), request.court(),
                request.division(), clients.getFirst(), lawyers.isEmpty()?null:lawyers.getFirst(), request.status(),
                request.opposingParty(), request.description());
        entity=repository.saveAndFlush(entity);
        syncMembers(entity.getId(),clients,lawyers);
        return enrichOne(entity);
    }

    public CaseResponse update(Long id, UpdateCaseRequest request) {
        access.require(id);
        jdbc.queryForList("SELECT id FROM cases WHERE id=? FOR UPDATE",id);
        CaseEntity entity = findEntity(id);
        List<Long> clients=request.clientIds()!=null?clientIds(request.clientIds(),null):request.clientId()!=null?List.of(request.clientId()):jdbc.queryForList("SELECT client_id FROM case_clients WHERE case_id=? ORDER BY client_id",Long.class,id);
        List<Long> lawyers=request.lawyerIds()!=null?lawyerIds(request.lawyerIds(),null):request.leadLawyerId()!=null?List.of(request.leadLawyerId()):jdbc.queryForList("SELECT user_id FROM case_lawyers WHERE case_id=? ORDER BY user_id",Long.class,id);
        validateMembers(clients,lawyers);
        Long primaryClient=clients.contains(entity.getClientId())?entity.getClientId():clients.getFirst();
        Long primaryLawyer=lawyers.contains(entity.getLeadLawyerId())?entity.getLeadLawyerId():lawyers.isEmpty()?null:lawyers.getFirst();
        apply(entity,
                request.caseNumber() != null ? request.caseNumber() : entity.getCaseNumber(),
                request.courtCaseNumber() != null ? request.courtCaseNumber() : entity.getCourtCaseNumber(),
                request.type() != null ? request.type() : entity.getType(),
                request.court() != null ? request.court() : entity.getCourt(),
                request.division() != null ? request.division() : entity.getDivision(),
                primaryClient,
                primaryLawyer,
                request.status() != null ? request.status() : entity.getStatus(),
                request.opposingParty() != null ? request.opposingParty() : entity.getOpposingParty(),
                request.description() != null ? request.description() : entity.getDescription());
        entity=repository.saveAndFlush(entity);syncMembers(id,clients,lawyers);
        return enrichOne(entity);
    }

    public void delete(Long id) {
        access.require(id);repository.delete(findEntity(id));
    }

    private CaseEntity findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Case not found"));
    }

    private List<CaseResponse> enrich(List<CaseEntity> entities) {
        Map<Long, String> clientNames = referenceLookupService.clientNames();
        Map<Long, String> userNames = referenceLookupService.userNames();
        return entities.stream().map(entity -> toResponse(entity, clientNames, userNames)).toList();
    }

    private CaseResponse enrichOne(CaseEntity entity) {
        return toResponse(entity, referenceLookupService.clientNames(), referenceLookupService.userNames());
    }

    private CaseResponse toResponse(CaseEntity entity, Map<Long, String> clientNames, Map<Long, String> userNames) {
        return new CaseResponse(
                entity.getId(), entity.getCaseNumber(), entity.getCourtCaseNumber(), entity.getType(), entity.getCourt(),
                entity.getDivision(), entity.getClientId(), clientNames.get(entity.getClientId()),
                entity.getLeadLawyerId(), entity.getLeadLawyerId() == null ? null : userNames.get(entity.getLeadLawyerId()),
                entity.getStatus(), entity.getOpposingParty(), entity.getDescription(), entity.getOfficeId(),
                entity.getCreatedAt(), entity.getUpdatedAt(),
                jdbc.queryForList("SELECT cl.id,cl.name FROM case_clients cc JOIN clients cl ON cl.id=cc.client_id WHERE cc.case_id=? ORDER BY cl.id",entity.getId()),
                jdbc.queryForList("SELECT u.id,u.name FROM case_lawyers l JOIN users u ON u.id=l.user_id WHERE l.case_id=? ORDER BY u.id",entity.getId())
        );
    }

    private List<Long> clientIds(List<Long> ids,Long legacy){return new ArrayList<>(new LinkedHashSet<>(ids!=null?ids:legacy!=null?List.of(legacy):List.of()));}
    private List<Long> lawyerIds(List<Long> ids,Long legacy){return clientIds(ids,legacy);}
    private void validateMembers(List<Long> clients,List<Long> lawyers){
        if(clients.isEmpty()||clients.size()>100||lawyers.size()>100)throw new BusinessRuleViolationException("Select at least one client and at most 100 participants of each kind");
        for(Long id:clients)if(id==null||jdbc.queryForObject("SELECT COUNT(*) FROM clients WHERE id=?",Long.class,id)==0)throw new BusinessRuleViolationException("Invalid client");
        for(Long id:lawyers)if(id==null||jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id=? AND active AND role IN ('lawyer','admin','owner')",Long.class,id)==0)throw new BusinessRuleViolationException("Invalid lawyer");
    }
    private void syncMembers(long id,List<Long> clients,List<Long> lawyers){
        for(Long old:jdbc.queryForList("SELECT client_id FROM case_clients WHERE case_id=?",Long.class,id))if(!clients.contains(old)){jdbc.update("UPDATE case_opponents SET related_client_id=NULL WHERE case_id=? AND related_client_id=?",id,old);jdbc.update("DELETE FROM case_clients WHERE case_id=? AND client_id=?",id,old);}
        for(Long old:jdbc.queryForList("SELECT user_id FROM case_lawyers WHERE case_id=?",Long.class,id))if(!lawyers.contains(old))jdbc.update("DELETE FROM case_lawyers WHERE case_id=? AND user_id=?",id,old);
        for(Long member:clients)jdbc.update("INSERT INTO case_clients(case_id,client_id) VALUES(?,?) ON CONFLICT DO NOTHING",id,member);
        for(Long member:lawyers)jdbc.update("INSERT INTO case_lawyers(case_id,user_id) VALUES(?,?) ON CONFLICT DO NOTHING",id,member);
    }

    private void apply(CaseEntity entity, String caseNumber, String courtCaseNumber, String type, String court,
                       String division, Long clientId, Long leadLawyerId, String status, String opposingParty, String description) {
        entity.setCaseNumber(caseNumber);
        entity.setCourtCaseNumber(courtCaseNumber);
        entity.setType(type != null ? type : "civil");
        entity.setCourt(court);
        entity.setDivision(division);
        entity.setClientId(clientId);
        entity.setLeadLawyerId(leadLawyerId);
        entity.setStatus(status != null ? status : "new");
        entity.setOpposingParty(opposingParty);
        entity.setDescription(description);
    }
}
