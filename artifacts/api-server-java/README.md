# LegalDesk Java Backend

Spring Boot backend for LegalDesk, organized as a modular monolith with a shared `legaldesk-common` module.

## Modules

```text
api-server-java/
  pom.xml
  README.md
  legaldesk-common/
  legaldesk-app/
```

## Stack

- Java 21
- Spring Boot 4
- Spring Security
- Spring Data JPA / Hibernate
- Flyway
- PostgreSQL in production
- H2 local profile for quick development

## Design

The backend uses:

- package-by-feature modules under `com.legaldesk.modules`
- a shared common module for exceptions and base JPA entities
- application services for use-case orchestration
- repositories for persistence access

Implemented modules:

- `auth`
- `users`
- `clients`
- `cases`
- `tasks`
- `documents`
- `hearings`
- `consultations`
- `payments`
- `poa`
- `notifications`
- `dashboard`
- `search`
- `audit`

## Important Paths

- App entry point:
  - `legaldesk-app/src/main/java/com/legaldesk/LegalDeskApplication.java`
- Security:
  - `legaldesk-app/src/main/java/com/legaldesk/shared/security/SecurityConfig.java`
- Exception handling:
  - `legaldesk-app/src/main/java/com/legaldesk/shared/web/ApiExceptionHandler.java`
- Flyway schema:
  - `legaldesk-app/src/main/resources/db/migration/V1__init_schema.sql`

## Run Locally

From `artifacts/api-server-java/legaldesk-app`:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The local profile uses the H2 file database.

## Build

From `artifacts/api-server-java`:

```bash
mvn -q -DskipTests package
```

## Related Docs

- [Repository Documentation Index](../../docs/README.md)
- [System Diagrams](../../docs/architecture/system-diagrams.md)
- [Frontend / Backend Service Map](../../docs/integration/frontend-backend-service-map.md)
- [Mobile App Handoff](../../docs/mobile/mobile-app-java-backend-handoff.md)

## Notes

- The backend keeps `/api/...` URL shapes to reduce frontend migration risk.
- Session-based authentication is implemented.
- Role-based authorization still needs deeper hardening.
