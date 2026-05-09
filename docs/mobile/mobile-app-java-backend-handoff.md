# Mobile App to Java Backend Handoff

This document summarizes the active mobile app and its integration with the Java backend.

## Scope

- Mobile app: `artifacts/legal-desk-mobile`
- Backend: `artifacts/api-server-java`

## Stack

- Expo
- React Native
- TypeScript
- Expo Router
- TanStack Query

## Current Navigation Shape

### Tabs

- Dashboard
- Cases
- Clients
- Tasks
- More

### More screens

- Hearings
- Consultations
- Payments
- Documents
- Powers of Attorney
- Notifications
- Users
- Profile

## Core Mobile Integration Files

- `artifacts/legal-desk-mobile/app/_layout.tsx`
- `artifacts/legal-desk-mobile/app/(tabs)/_layout.tsx`
- `artifacts/legal-desk-mobile/context/AuthContext.tsx`
- `artifacts/legal-desk-mobile/utils/api.ts`
- `artifacts/legal-desk-mobile/components/mobile`

## API Base URL Resolution

The mobile app resolves the backend base URL in this order:

1. `EXPO_PUBLIC_API_BASE_URL`
2. `EXPO_PUBLIC_DOMAIN`
3. `/api` for web-hosted Expo use

Recommended local value:

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8015/api
```

For a physical device, use the machine LAN IP instead of `127.0.0.1`.

## Authentication Flow

1. App starts
2. `AuthContext` calls `GET /api/auth/me`
3. If authenticated, the user enters the tabs group
4. If not authenticated, the app redirects to `/login`
5. Login uses `POST /api/auth/login`
6. Logout uses `POST /api/auth/logout`

## Screen Coverage

The mobile app now covers these backend modules:

- `auth`
- `dashboard`
- `clients`
- `cases`
- `tasks`
- `hearings`
- `consultations`
- `payments`
- `documents`
- `poa`
- `notifications`
- `users`

## Practical Developer Notes

- Shared reusable mobile UI lives under `components/mobile`
- Most management screens use `FormModal` for create/update flows
- API helpers live in `utils/api.ts`
- Formatting helpers live in `utils/format.ts`
- lookup values and labels live in `constants/lookups.ts`

## Recommended Next Work

1. Add deeper detail screens where the web app has richer drill-down behavior
2. Add device-native QA on Android and iOS
3. Add E2E coverage for login and CRUD flows
4. Tighten validation and user-facing error messages per module
