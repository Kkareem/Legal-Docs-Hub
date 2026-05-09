package com.legaldesk.modules.search.api;

import com.legaldesk.modules.search.application.SearchQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
public class SearchController {
    private final SearchQueryService service;
    public SearchController(SearchQueryService service) { this.service = service; }
    @GetMapping public SearchResponse search(@RequestParam("q") String q) { return service.search(q); }
}
