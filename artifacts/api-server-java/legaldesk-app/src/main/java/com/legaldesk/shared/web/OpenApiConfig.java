package com.legaldesk.shared.web;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "LegalDesk API",
                version = "v1",
                description = "Java Spring Boot backend for LegalDesk legal office management.",
                contact = @Contact(name = "LegalDesk Backend Team"),
                license = @License(name = "Internal")
        ),
        security = @SecurityRequirement(name = "sessionCookie")
)
@SecurityScheme(
        name = "sessionCookie",
        type = SecuritySchemeType.APIKEY,
        in = SecuritySchemeIn.COOKIE,
        paramName = "JSESSIONID",
        description = "Session cookie issued by POST /api/auth/login"
)
public class OpenApiConfig {

    @Bean
    public OpenAPI legalDeskOpenApi() {
        return new OpenAPI().servers(List.of(
                new Server().url("/").description("Current server")
        ));
    }
}
