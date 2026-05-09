package com.legaldesk.modules.search.application;

import com.legaldesk.modules.cases.application.CaseApplicationService;
import com.legaldesk.modules.clients.application.ClientApplicationService;
import com.legaldesk.modules.hearings.application.HearingApplicationService;
import com.legaldesk.modules.search.api.SearchResponse;
import com.legaldesk.modules.tasks.application.TaskApplicationService;
import org.springframework.stereotype.Service;

@Service
public class SearchQueryService {
    private final ClientApplicationService clientService;
    private final CaseApplicationService caseService;
    private final TaskApplicationService taskService;
    private final HearingApplicationService hearingService;
    public SearchQueryService(ClientApplicationService clientService, CaseApplicationService caseService, TaskApplicationService taskService, HearingApplicationService hearingService) {
        this.clientService = clientService;
        this.caseService = caseService;
        this.taskService = taskService;
        this.hearingService = hearingService;
    }
    public SearchResponse search(String q) {
        if (q == null || q.trim().length() < 2) {
            return new SearchResponse(java.util.List.of(), java.util.List.of(), java.util.List.of(), java.util.List.of());
        }
        String query = q.trim();
        return new SearchResponse(
                clientService.list(null, query).stream().limit(5).toList(),
                caseService.list(null, null, null, null, query).stream().limit(5).toList(),
                taskService.list(null, null, null, null).stream().filter(t -> t.title().toLowerCase().contains(query.toLowerCase())).limit(5).toList(),
                hearingService.list(null, null, null, null).stream().filter(h -> (h.court() != null && h.court().toLowerCase().contains(query.toLowerCase())) || (h.notes() != null && h.notes().toLowerCase().contains(query.toLowerCase()))).limit(5).toList()
        );
    }
}
