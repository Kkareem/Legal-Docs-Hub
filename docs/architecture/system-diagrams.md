# LegalDesk System Diagrams

This document is based on the current active codebase:

- `artifacts/api-server-java`
- `artifacts/legal-desk`
- `artifacts/legal-desk-mobile`
- `lib`

It contains:

1. ERD
2. Class Diagram
3. Architecture Diagram

## ERD

```mermaid
erDiagram
    USERS {
        bigint id PK
        text name
        text email UK
        text password_hash
        text phone
        text role
        bigint office_id
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    CLIENTS {
        bigint id PK
        text name
        text phone
        text email
        text national_id
        text address
        bigint office_id
        text status
        text service_type
        text notes
        bigint user_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    CASES {
        bigint id PK
        text case_number
        text court_case_number
        text type
        text court
        text division
        bigint client_id FK
        bigint lead_lawyer_id FK
        text status
        text opposing_party
        text description
        bigint office_id
        timestamptz created_at
        timestamptz updated_at
    }

    DOCUMENTS {
        bigint id PK
        bigint case_id FK
        bigint client_id FK
        text file_url
        text file_name
        text doc_type
        boolean is_original
        bigint uploaded_by FK
        text notes
        timestamptz created_at
    }

    TASKS {
        bigint id PK
        text title
        text description
        bigint case_id FK
        bigint assigned_to FK
        timestamptz due_date
        text priority
        text status
        bigint office_id
        timestamptz created_at
        timestamptz updated_at
    }

    HEARINGS {
        bigint id PK
        bigint case_id FK
        timestamptz datetime
        text court
        text type
        bigint assigned_lawyer FK
        text status
        text notes
        timestamptz created_at
    }

    CONSULTATIONS {
        bigint id PK
        bigint client_id FK
        text summary
        text payment_status
        numeric fee
        text status
        bigint assigned_to FK
        text response
        timestamptz created_at
        timestamptz updated_at
    }

    PAYMENTS {
        bigint id PK
        bigint client_id FK
        bigint case_id FK
        bigint consultation_id FK
        numeric amount
        text type
        text status
        timestamptz paid_at
        text notes
        timestamptz created_at
    }

    POWERS_OF_ATTORNEY {
        bigint id PK
        bigint client_id FK
        bigint case_id FK
        bigint received_by FK
        text handed_by
        timestamptz received_at
        timestamptz return_by
        timestamptz returned_at
        text status
        text notes
        timestamptz created_at
    }

    NOTIFICATIONS {
        bigint id PK
        bigint user_id FK
        text type
        text title
        text body
        boolean read
        bigint ref_id
        text ref_type
        timestamptz created_at
    }

    AUDIT_LOGS {
        bigint id PK
        bigint user_id FK
        text action
        text entity
        bigint entity_id
        text old_val
        text new_val
        timestamptz created_at
    }

    USERS ||--o{ CLIENTS : owns_or_manages
    USERS ||--o{ CASES : leads
    USERS ||--o{ TASKS : assigned_to
    USERS ||--o{ HEARINGS : assigned_lawyer
    USERS ||--o{ CONSULTATIONS : assigned_to
    USERS ||--o{ DOCUMENTS : uploaded_by
    USERS ||--o{ POWERS_OF_ATTORNEY : received_by
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ AUDIT_LOGS : acts

    CLIENTS ||--o{ CASES : has
    CLIENTS ||--o{ CONSULTATIONS : requests
    CLIENTS ||--o{ PAYMENTS : pays
    CLIENTS ||--o{ DOCUMENTS : owns
    CLIENTS ||--o{ POWERS_OF_ATTORNEY : grants

    CASES ||--o{ TASKS : contains
    CASES ||--o{ HEARINGS : schedules
    CASES ||--o{ DOCUMENTS : attaches
    CASES ||--o{ PAYMENTS : bills
    CASES ||--o{ POWERS_OF_ATTORNEY : needs

    CONSULTATIONS ||--o{ PAYMENTS : billed_by
```

Source of truth:

- `artifacts/api-server-java/legaldesk-app/src/main/resources/db/migration/V1__init_schema.sql`

## Class Diagram

This class diagram focuses on the backend module pattern and the most important domain classes rather than every DTO.

```mermaid
classDiagram
    class LegalDeskApplication
    class SecurityConfig
    class ApiExceptionHandler

    class BaseEntity {
      +Long id
    }

    class AuditedEntity {
      +OffsetDateTime createdAt
      +OffsetDateTime updatedAt
    }

    BaseEntity <|-- AuditedEntity

    class UserEntity {
      +String name
      +String email
      +String passwordHash
      +String role
      +Boolean active
    }

    class ClientEntity {
      +String name
      +String phone
      +String email
      +String status
      +String serviceType
    }

    class CaseEntity {
      +String caseNumber
      +String type
      +String court
      +String status
    }

    class TaskEntity {
      +String title
      +String priority
      +String status
      +OffsetDateTime dueDate
    }

    class HearingEntity {
      +OffsetDateTime datetime
      +String court
      +String type
      +String status
    }

    class ConsultationEntity {
      +String summary
      +String paymentStatus
      +BigDecimal fee
      +String status
    }

    class PaymentEntity {
      +BigDecimal amount
      +String type
      +String status
      +OffsetDateTime paidAt
    }

    class DocumentEntity {
      +String fileName
      +String fileUrl
      +String docType
      +Boolean isOriginal
    }

    class PowerOfAttorneyEntity {
      +String handedBy
      +OffsetDateTime receivedAt
      +OffsetDateTime returnedAt
      +String status
    }

    class NotificationEntity {
      +String type
      +String title
      +String body
      +Boolean read
    }

    class AuditLogEntity {
      +String action
      +String entity
      +Long entityId
    }

    AuditedEntity <|-- UserEntity
    AuditedEntity <|-- ClientEntity
    AuditedEntity <|-- CaseEntity
    AuditedEntity <|-- TaskEntity
    BaseEntity <|-- HearingEntity
    AuditedEntity <|-- ConsultationEntity
    BaseEntity <|-- PaymentEntity
    BaseEntity <|-- DocumentEntity
    BaseEntity <|-- PowerOfAttorneyEntity
    BaseEntity <|-- NotificationEntity
    BaseEntity <|-- AuditLogEntity

    class AuthController
    class AuthApplicationService
    AuthController --> AuthApplicationService

    class UserController
    class UserApplicationService
    class UserEntityRepository
    UserController --> UserApplicationService
    UserApplicationService --> UserEntityRepository
    UserApplicationService --> UserEntity

    class ClientController
    class ClientApplicationService
    class ClientEntityRepository
    ClientController --> ClientApplicationService
    ClientApplicationService --> ClientEntityRepository
    ClientApplicationService --> ClientEntity

    class CaseController
    class CaseApplicationService
    class CaseEntityRepository
    CaseController --> CaseApplicationService
    CaseApplicationService --> CaseEntityRepository
    CaseApplicationService --> CaseEntity
    CaseApplicationService --> ClientEntityRepository
    CaseApplicationService --> UserEntityRepository

    class TaskController
    class TaskApplicationService
    class TaskEntityRepository
    TaskController --> TaskApplicationService
    TaskApplicationService --> TaskEntityRepository
    TaskApplicationService --> CaseEntityRepository
    TaskApplicationService --> UserEntityRepository

    class HearingController
    class HearingApplicationService
    class HearingEntityRepository
    HearingController --> HearingApplicationService
    HearingApplicationService --> HearingEntityRepository
    HearingApplicationService --> CaseEntityRepository
    HearingApplicationService --> UserEntityRepository

    class ConsultationController
    class ConsultationApplicationService
    class ConsultationEntityRepository
    ConsultationController --> ConsultationApplicationService
    ConsultationApplicationService --> ConsultationEntityRepository
    ConsultationApplicationService --> ClientEntityRepository
    ConsultationApplicationService --> UserEntityRepository

    class PaymentController
    class PaymentApplicationService
    class PaymentEntityRepository
    PaymentController --> PaymentApplicationService
    PaymentApplicationService --> PaymentEntityRepository
    PaymentApplicationService --> ClientEntityRepository
    PaymentApplicationService --> CaseEntityRepository
    PaymentApplicationService --> ConsultationEntityRepository

    class DocumentController
    class DocumentApplicationService
    class DocumentEntityRepository
    DocumentController --> DocumentApplicationService
    DocumentApplicationService --> DocumentEntityRepository
    DocumentApplicationService --> CaseEntityRepository
    DocumentApplicationService --> ClientEntityRepository
    DocumentApplicationService --> UserEntityRepository

    class PowerOfAttorneyController
    class PowerOfAttorneyApplicationService
    class PowerOfAttorneyEntityRepository
    PowerOfAttorneyController --> PowerOfAttorneyApplicationService
    PowerOfAttorneyApplicationService --> PowerOfAttorneyEntityRepository
    PowerOfAttorneyApplicationService --> ClientEntityRepository
    PowerOfAttorneyApplicationService --> CaseEntityRepository
    PowerOfAttorneyApplicationService --> UserEntityRepository

    class NotificationController
    class NotificationApplicationService
    class NotificationEntityRepository
    NotificationController --> NotificationApplicationService
    NotificationApplicationService --> NotificationEntityRepository

    class DashboardController
    class DashboardQueryService
    DashboardController --> DashboardQueryService

    class SearchController
    class SearchQueryService
    SearchController --> SearchQueryService

    LegalDeskApplication --> SecurityConfig
    LegalDeskApplication --> ApiExceptionHandler
```

Primary code sources:

- `artifacts/api-server-java/legaldesk-common/src/main/java/com/legaldesk/common/jpa`
- `artifacts/api-server-java/legaldesk-app/src/main/java/com/legaldesk/modules`
- `artifacts/api-server-java/legaldesk-app/src/main/java/com/legaldesk/shared`

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Clients["Client Applications"]
        WEB["Web App
React + TypeScript + Vite
artifacts/legal-desk"]
        MOBILE["Mobile App
React Native + TypeScript + Expo
artifacts/legal-desk-mobile"]
    end

    subgraph SharedFrontend["Shared Frontend Libraries"]
        API_CLIENT["lib/api-client-react
Generated React Query client"]
        API_SPEC["lib/api-spec
OpenAPI spec / contracts"]
        API_ZOD["lib/api-zod
Generated Zod schemas"]
    end

    subgraph Backend["Java Backend
artifacts/api-server-java"]
        COMMON["legaldesk-common
shared exceptions + base entities"]

        subgraph APP["legaldesk-app"]
            SECURITY["shared.security
Spring Security + session auth + CORS"]
            WEBLAYER["shared.web
ApiExceptionHandler"]

            subgraph MODULES["Business Modules"]
                AUTH["auth"]
                USERS["users"]
                CLIENTS_M["clients"]
                CASES_M["cases"]
                TASKS_M["tasks"]
                HEARINGS_M["hearings"]
                CONSULTS_M["consultations"]
                DOCS_M["documents"]
                PAYMENTS_M["payments"]
                POA_M["poa"]
                NOTIFS_M["notifications"]
                DASHBOARD_M["dashboard"]
                SEARCH_M["search"]
                AUDIT_M["audit"]
            end
        end
    end

    subgraph Data["Data Layer"]
        DB["PostgreSQL
Flyway schema"]
    end

    WEB --> API_CLIENT
    MOBILE --> API_CLIENT
    API_CLIENT --> API_SPEC
    API_CLIENT --> API_ZOD

    WEB --> SECURITY
    MOBILE --> SECURITY

    SECURITY --> AUTH
    AUTH --> USERS

    WEBLAYER --> COMMON

    CLIENTS_M --> DB
    USERS --> DB
    CASES_M --> DB
    TASKS_M --> DB
    HEARINGS_M --> DB
    CONSULTS_M --> DB
    DOCS_M --> DB
    PAYMENTS_M --> DB
    POA_M --> DB
    NOTIFS_M --> DB
    AUDIT_M --> DB
    DASHBOARD_M --> DB
    SEARCH_M --> DB

    COMMON --> USERS
    COMMON --> CLIENTS_M
    COMMON --> CASES_M
    COMMON --> TASKS_M
    COMMON --> HEARINGS_M
    COMMON --> CONSULTS_M
    COMMON --> DOCS_M
    COMMON --> PAYMENTS_M
    COMMON --> POA_M
    COMMON --> NOTIFS_M
```

### Runtime request flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web or Mobile App
    participant C as API Client / fetch layer
    participant S as Spring Security
    participant CTR as REST Controller
    participant APP as Application Service
    participant REP as JPA Repository
    participant DB as Database

    U->>W: Trigger action
    W->>C: Build request
    C->>S: HTTP /api/*
    S->>CTR: Authenticated request
    CTR->>APP: Validate + delegate
    APP->>REP: Query or persist
    REP->>DB: SQL via JPA/Hibernate
    DB-->>REP: Rows
    REP-->>APP: Entities
    APP-->>CTR: Response DTO
    CTR-->>W: JSON response
    W-->>U: Render updated UI
```

## Notes

- The ERD is based on the Flyway baseline schema, which is the clearest source for table-level relationships.
- The class diagram is intentionally simplified to show the module template and the main backend dependency flow.
- The architecture diagram reflects the current monorepo and local runtime integration model.
