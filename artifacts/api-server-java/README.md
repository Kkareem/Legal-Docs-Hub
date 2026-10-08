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
- PostgreSQL for local development and production

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

Start the local PostgreSQL database from `artifacts/api-server-java` (Docker Desktop must be running):

```bash
docker compose up -d --wait
mvn install -DskipTests
```

Then, from `artifacts/api-server-java/legaldesk-app`:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The local profile connects to `jdbc:postgresql://localhost:5432/legaldesk`, with username `legaldesk` and password `legaldesk`. These credentials are for local development only. Override them with `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` to use an existing PostgreSQL installation. `DATABASE_URL` must be a JDBC URL.

Flyway creates the schema on startup, and Hibernate validates it. Data persists across application restarts in the Docker volume; `docker compose down` stops the database without removing that volume.

For DBeaver, select the PostgreSQL driver and connect to host `localhost`, port `5432`, database `legaldesk`, username `legaldesk`, and password `legaldesk`.

Existing H2 data is not imported automatically. The old `.data` files are left untouched.

## Lawyer onboarding and visitor consultations

- Angular `/lawyers`: admins and owners create lawyer accounts with a temporary password (at least 10 characters). New accounts must change it at `/change-password`; the backend blocks protected APIs until this is done.
- Angular `/consultation`: visitors submit a consultation without signing in and receive a request number and secret tracking token. Both are required to view the status and reply. No email or SMS is sent.
- Angular `/consultation-requests`: admins and owners view all visitor requests, reply directly, or assign an active lawyer. Lawyers see and reply only to their own assigned requests. Messages are preserved in order. Once staff replies, staff must wait for the visitor's follow-up; the visitor replies from the secret tracking page, which reopens the staff reply. The backend enforces these turns, including concurrent submissions. Existing replies are preserved by migration V3. Visitor requests are stored separately from existing client consultations.
- Dashboard `totalVisitors` counts distinct browser IDs saved in local storage when the public consultation page opens. Refreshing does not increment the counter; another browser or clearing storage counts as another visitor. Pending consultations include visitor requests.

Consultations support multiple assigned lawyers. Admins select them with checkboxes and always retain access. Only assigned lawyers can see or reply to the request; removing an assignee revokes both permissions. Migration V4 carries existing assignments forward. Each staff message stores the author's name when sent, so later reassignment does not change the names on earlier replies. The conversation still alternates between the office and visitor, with one shared office turn across all assigned lawyers.

With the local PostgreSQL Compose service, backend, and Angular server running, run the API smoke checks from this directory using PowerShell 7:

```powershell
./scripts/smoke-onboarding.ps1
```

The script uses local demo admin credentials by default, verifies onboarding, authorization, assignment, replies, tracking, and visitor deduplication through Angular's proxy, and removes its synthetic fixtures from the local Compose database. Override `AdminEmail` and `AdminPassword` if the demo account has been changed.

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
