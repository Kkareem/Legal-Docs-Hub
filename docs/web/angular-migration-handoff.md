# Angular Migration Handoff

## Scope Delivered

A new Angular web application was added in:

- `artifacts/legal-desk-angular`

This app is intentionally additive. The existing React app remains in place while Angular is introduced gradually.

## What Works

- login against the Java backend session auth
- protected shell layout
- dashboard summary
- clients list + create + delete
- cases list + create + delete
- tasks list + create + mark done + delete
- `/api` proxy to `http://127.0.0.1:8015`

## Architecture

- Angular 21
- standalone components
- Angular Router
- `HttpClient` with `withCredentials: true`
- route guard based on `/api/auth/me`
- feature pages under `src/app/pages`
- shared API/auth logic under `src/app/core`

## Key Files

- `src/app/core/api.service.ts`
- `src/app/core/auth.service.ts`
- `src/app/core/auth.guard.ts`
- `src/app/layout/shell.component.ts`
- `src/app/pages/login.component.ts`
- `src/app/pages/dashboard.component.ts`
- `src/app/pages/clients.component.ts`
- `src/app/pages/cases.component.ts`
- `src/app/pages/tasks.component.ts`
- `proxy.conf.json`

## Local Run

1. Start backend:
   - `cd artifacts/api-server-java/legaldesk-app`
   - `mvn spring-boot:run -Dspring-boot.run.profiles=local -Dspring-boot.run.arguments=--server.port=8015`
2. Start Angular app:
   - `cd artifacts/legal-desk-angular`
   - `npm install`
   - `npm start`
3. Open:
   - `http://localhost:4020`

## Migration Strategy

Recommended next porting order from React to Angular:

1. Hearings
2. Consultations
3. Payments
4. Documents
5. Powers of attorney
6. Users
7. Notifications
8. Profile
9. Case detail
10. Client detail

## Notes

- The Angular app currently uses local interfaces instead of importing the generated React client package.
- This was done to keep the Angular migration independent and fast to evolve.
- Once the Angular direction is confirmed, the next improvement should be a shared framework-agnostic TypeScript contracts package.
