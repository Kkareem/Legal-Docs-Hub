# Frontend / Backend Service Map

This document explains how the active frontends connect to the active Java backend after the migration cutover.

## Active Applications

- Web app: `artifacts/legal-desk`
- Mobile app: `artifacts/legal-desk-mobile`
- Backend: `artifacts/api-server-java`
- Shared API packages:
  - `lib/api-client-react`
  - `lib/api-spec`
  - `lib/api-zod`

## Integration Model

### Web

The web app uses generated hooks from `lib/api-client-react` and sends browser requests with cookies included.

Key files:

- `artifacts/legal-desk/src/App.tsx`
- `artifacts/legal-desk/src/lib/auth.tsx`
- `artifacts/legal-desk/src/main.tsx`
- `artifacts/legal-desk/vite.config.ts`
- `lib/api-client-react/src/generated/api.ts`
- `lib/api-client-react/src/custom-fetch.ts`

### Mobile

The mobile app calls the backend directly through its fetch helper and auth context.

Key files:

- `artifacts/legal-desk-mobile/app/_layout.tsx`
- `artifacts/legal-desk-mobile/context/AuthContext.tsx`
- `artifacts/legal-desk-mobile/utils/api.ts`

### Backend

The backend follows a modular structure where each feature has:

- `api`
- `application`
- `domain`
- `infrastructure`

Key backend files:

- `artifacts/api-server-java/legaldesk-app/src/main/java/com/legaldesk/LegalDeskApplication.java`
- `artifacts/api-server-java/legaldesk-app/src/main/java/com/legaldesk/shared/security/SecurityConfig.java`
- `artifacts/api-server-java/legaldesk-app/src/main/java/com/legaldesk/shared/web/ApiExceptionHandler.java`

## Request Flow

1. A screen or component triggers a hook or fetch helper.
2. The frontend sends `/api/*` requests.
3. The Java backend authenticates the session via Spring Security.
4. The module controller delegates to its application service.
5. The application service persists or queries through JPA repositories.
6. The backend returns DTOs to the frontend.

## Screen to Module Map

| Frontend Screen | Frontend App | Main Endpoint Family | Backend Module |
|---|---|---|---|
| Login | Web + Mobile | `/api/auth/*` | `auth` |
| Dashboard | Web + Mobile | `/api/dashboard/*` | `dashboard` |
| Clients | Web + Mobile | `/api/clients*` | `clients` |
| Cases | Web + Mobile | `/api/cases*` | `cases` |
| Tasks | Web + Mobile | `/api/tasks*` | `tasks` |
| Hearings | Web + Mobile | `/api/hearings*` | `hearings` |
| Consultations | Web + Mobile | `/api/consultations*` | `consultations` |
| Payments | Web + Mobile | `/api/payments*` | `payments` |
| Documents | Web + Mobile | `/api/documents*` | `documents` |
| Powers of Attorney | Web + Mobile | `/api/powers-of-attorney*` | `poa` |
| Notifications | Web + Mobile | `/api/notifications*` | `notifications` |
| Users | Web + Mobile | `/api/users*` | `users` |
| Search | Web | `/api/search*` | `search` |

## Module Ownership Reference

When changing behavior:

- UI behavior and routing:
  - web: `artifacts/legal-desk/src`
  - mobile: `artifacts/legal-desk-mobile/app`
- API contract generation:
  - `lib/api-spec`
  - `lib/api-client-react`
  - `lib/api-zod`
- business logic:
  - `artifacts/api-server-java/legaldesk-app/src/main/java/com/legaldesk/modules`

## Notes

- The backend intentionally keeps `/api/...` URL patterns to reduce migration risk.
- Web uses a Vite proxy in local development.
- Mobile uses direct API base URL resolution and should use LAN IP on physical devices.
