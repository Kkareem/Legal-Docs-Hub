package com.legaldesk.modules.search.api;

import com.legaldesk.modules.cases.api.CaseResponse;
import com.legaldesk.modules.clients.api.ClientResponse;
import com.legaldesk.modules.hearings.api.HearingResponse;
import com.legaldesk.modules.tasks.api.TaskResponse;
import java.util.List;

public record SearchResponse(
        List<ClientResponse> clients,
        List<CaseResponse> cases,
        List<TaskResponse> tasks,
        List<HearingResponse> hearings
) {
}
