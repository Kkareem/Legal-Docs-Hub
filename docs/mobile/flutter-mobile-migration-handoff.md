# Flutter Mobile Migration Handoff

## Purpose

This document explains the new Flutter mobile migration app, the architecture chosen for it, the official guidance it follows, and the current validated scope.

Repository path:

- `D:\WorkSpace\Lawyer\Legal-Docs-Hub\artifacts\legal-desk-flutter`

## Why this architecture

The Flutter app follows Flutter's current official architecture guidance:

- Flutter app architecture guide:
  - [Guide to app architecture](https://docs.flutter.dev/app-architecture/guide)
- Architecture recommendations:
  - [Architecture recommendations and resources](https://docs.flutter.dev/app-architecture/recommendations)
- Common concepts:
  - [Common architecture concepts](https://docs.flutter.dev/app-architecture/concepts)
- Navigation:
  - [Navigation and routing](https://docs.flutter.dev/ui/navigation)

The official guidance strongly leans toward:

- separation of concerns
- layered architecture
- MVVM in the UI layer
- repositories as source of truth
- services for remote data access
- `provider` for dependency injection
- `go_router` for apps with advanced routing needs

That is the basis for the current implementation.

## Chosen stack

- Flutter stable
- Dart 3
- Material 3
- `provider` for dependency injection and view model binding
- `go_router` for navigation and route guarding
- `dio` for HTTP
- `dio_cookie_manager` + `cookie_jar` for session persistence on non-web targets
- `shared_preferences` for lightweight local settings
- feature-first folder structure

## Current structure

```text
lib/
  main.dart
  src/
    app/
      bootstrap.dart
      legaldesk_app.dart
      router/
      theme/
    core/
      config/
      errors/
      models/
      network/
      widgets/
    features/
      auth/
      dashboard/
      clients/
      client_detail/
      cases/
      case_detail/
      tasks/
      hearings/
      consultations/
      payments/
      documents/
      notifications/
      poa/
      profile/
      search/
      home/
      more/
      users/
```

## Layering model

Each feature currently follows this shape:

```text
feature/
  data/
    *_api_service.dart
    *_repository.dart
    *_models.dart
  presentation/
    ..._view.dart
    ..._view_model.dart
```

Responsibilities:

- `View`: widgets, forms, event wiring, screen composition
- `ViewModel`: UI state, orchestration, validation, loading/error handling
- `Repository`: source of truth for feature data and app-facing operations
- `ApiService`: backend endpoint wrapper only

## Auth and session model

The backend is session-based Spring Security, not JWT-based.

Important implication:

- the Flutter app must preserve cookies for authenticated flows

Current implementation:

- Web: `BrowserHttpClientAdapter(withCredentials: true)`
- Non-web: `CookieManager(CookieJar())`

This was chosen because it matches the Java backend's real behavior instead of forcing an artificial token architecture.

## Current validated scope

The following slice is implemented and validated:

- login
- dashboard
- clients
- client detail
- cases
- case detail
- tasks
- hearings
- consultations
- payments
- documents
- powers of attorney
- search
- notifications
- profile
- users
- more navigation hub

Validated checks:

- `flutter analyze`
- `flutter build web`
- local web-server startup
- backend login and authenticated API checks against:
  - `/api/dashboard/summary`
  - `/api/clients`
  - `/api/cases`
  - `/api/tasks`
  - `/api/hearings`
  - `/api/consultations`
  - `/api/payments`
  - `/api/documents`
  - `/api/powers-of-attorney`
  - `/api/search`
  - `/api/notifications`
  - `/api/users`

## Commands

### Install

```bash
flutter pub get
```

### Analyze

```bash
flutter analyze
```

### Build web

```bash
flutter build web
```

### Run locally against Java backend

```bash
flutter run -d web-server --web-port 4030 --web-hostname 127.0.0.1 --dart-define=API_BASE_URL=http://127.0.0.1:8015/api
```

## Important notes for the team

### 1. Keep the same architecture

Do not mix feature code across random shared folders. New features should follow the same feature-first structure and the same View -> ViewModel -> Repository -> Service boundaries.

### 2. Add a domain/use-case layer only when complexity demands it

Flutter's official guidance treats the domain layer as optional. We should add use-cases only when:

- logic spans multiple repositories
- logic becomes too large for a view model
- logic is reused across screens

For the current slice, the lighter MVVM structure is sufficient.

### 3. Preserve session-based auth

Do not prematurely rewrite the mobile app around JWT unless the backend contract changes. Right now the strongest design choice is to respect the existing server-side session model.

### 4. Next recommended features

The next migration steps should be:

1. richer edit flows inside detail screens
2. profile/preferences enrichment
3. file picker and native attachment UX
4. stronger validation and typed input components
5. device-native verification on Android and iOS
6. targeted unit tests for the new detail/search/poa features

### 5. Testing direction

Recommended next additions:

- repository unit tests with fake services
- view model tests
- golden/smoke tests for core screens
- authenticated integration smoke tests

## My architecture notes

These are the main implementation decisions I recommend keeping:

- use `provider` unless we hit scaling pain that clearly justifies Riverpod
- keep repositories app-facing and services transport-facing
- centralize app config in one place
- centralize network exception mapping
- keep routing auth-aware using `go_router`
- prefer small reusable widgets in `core/widgets` only when they are truly shared

## Risks and follow-up discussions

These are the points I think are worth discussing together before we scale further:

1. Whether we want to keep both Expo and Flutter during migration or start planning a full cutover.
2. Whether we want feature parity first, or UI refinement first.
3. Whether to introduce a domain layer before or after the second wave of features.
4. Whether we want offline-first behavior later for tasks and hearings.

Current recommendation:

- keep Expo temporarily
- continue Flutter feature parity first
- delay domain/use-case layer until feature complexity justifies it
