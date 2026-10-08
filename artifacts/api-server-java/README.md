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

## Client portal

- Staff open the Clients page and choose **Create client account**, providing an email and a temporary password of at least 10 characters. Admins/owners may provision any client; a lawyer may provision a client of a case assigned to them. Existing demo links from client records to staff identities are removed by V5 so that staff accounts are not treated as client logins.
- Clients sign in on the normal login page, must change their temporary password, and are redirected to Angular `/my-account`. The server blocks client accounts from office APIs and scopes portal queries, uploads, downloads, consultations, payments, and reviews to their linked client record.
- From Cases, staff open **Client follow-up, hearings and fees** to publish progress updates, schedule hearings, share files, and request case fees. These actions are restricted to admins/owners and the case's lead lawyer.
- Client and staff case attachments support multiple files of any type: at most 10 per upload, 20 MB each and 50 MB total. All attachments and receipts use `documents`. V7 migrates stored files and receipt references and preserves old download links. Bytes are stored in PostgreSQL, persist with the database volume, and are served as authenticated downloads. Existing document metadata remains visible; a legacy document URL is not automatically imported as stored file content.
- Admins set the office's real bank details under **Bank transfers and receipts**. Clients transfer externally and upload a receipt and transfer reference. A submitted receipt sets the payment to `under_review`, not `paid`. Only admins/owners can approve or reject it; rejection allows a new submission. General payment requests can be created on this page as well.
- Clients can create consultations for their own cases, reply when it is their turn, and explicitly link an earlier visitor consultation using its request number and secret token. Records are never claimed by matching email alone.
- A client can submit one rating from 1 to 5 for the lead lawyer after their case is closed. The rating appears in the case workspace.

With the local Compose database and backend running, `./scripts/smoke-client-portal.ps1` verifies onboarding, two-client data isolation, multi-file downloads, case progress and hearings, consultation ownership, receipt rejection/approval, and closed-case ratings. It removes only its synthetic fixtures.

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

## Office currency and notifications

- Set `APP_CURRENCY` to the ISO 4217 code when preparing each office's deployment, e.g. `EGP`, `SAR`, `AED`, or `USD`. It defaults to `SAR` for the existing demo. All Angular amounts use the backend setting, including dashboard totals and client payments. Amounts retain two decimal places; changing the code does not perform an exchange-rate conversion. Configure it before entering real financial records.
- `/settings` is available to lawyers, admins and clients. Each account independently enables site, email and browser channels. New case/status/progress, hearing, consultation assignment/replies, task and payment/receipt events create notifications transactionally. Site counts refresh every 20 seconds while signed in; `/notifications` shows the current user's alerts and supports marking them read.
- Admins/owners configure **Office email via Gmail** on the same page. Only the Gmail address and a Google **app password** are needed; the server uses Gmail's authenticated TLS service automatically. Enable Google 2-Step Verification and generate a 16-character app password at https://myaccount.google.com/apppasswords. Ordinary Google account passwords are not supported. Some managed or Advanced Protection accounts do not offer app passwords. Email remains disabled until the office configures it; old events are not queued retroactively.
- Gmail credentials and the Web Push private key are encrypted with AES-GCM. The encryption key is created once at `.data/settings.key` relative to the backend's working directory. For deployment set `APP_SETTINGS_KEY_FILE` to a persistent private file accessible only to the service account; back it up together with PostgreSQL. Losing this file requires re-entering Gmail credentials and re-subscribing browsers. Never commit it.
- Standard Web Push works in the background through `/notifications-sw.js`, without a paid notification provider. VAPID keys are generated once and retained in PostgreSQL. Set `VAPID_SUBJECT` to a real support `mailto:` address and `APP_PUBLIC_URL` to the public HTTPS origin. Each device grants its own browser permission. Disabling the browser channel removes all devices for that account; logging out removes the current subscription. Expired subscriptions are removed automatically.
- Email/push use a persisted delivery queue with leases and bounded retries (up to five attempts), expire after seven days, and recheck current channel preferences before sending. Email delivery totals are visible to admins under Gmail settings. As with SMTP generally, a timeout after acceptance may result in a duplicate on retry. External messages contain a generic update notice and a login link, never case documents or consultation contents.
- Serve Angular and `/api` on the same HTTPS origin. Reverse-proxy `/api` to Spring and use SPA fallback (`try_files $uri $uri/ /index.html`) for Angular routes. Serve `/notifications-sw.js` with `Cache-Control: no-cache`. Set `SESSION_COOKIE_SECURE=true` in HTTPS production. Keep `.data` and the encryption key outside the public web root.
- The responsive UI supports current Chrome, Edge, Firefox and Safari, including mobile browsers. Tables scroll within their container and the office menu collapses on small screens. A web manifest and PNG icons support installing to the home screen. On iPhone/iPad, background push requires iOS/iPadOS 16.4+ and opening the installed home-screen app; regular page browsing does not require installation. Unsupported or non-HTTPS browsers keep site/email functionality and display an explanation when push is enabled.
- Local checks: `./scripts/smoke-client-portal.ps1` includes notification ownership, opt-out and client-role checks. Pipe `scripts/test-notification-delivery.sql` to the Compose PostgreSQL `psql` command to check independent delivery queues in a rolled-back transaction; it sends no external messages. Real Gmail and OS push delivery must be verified after configuring the office account and granting permission on an actual device.


### Case participants, opponents and activity

V9 migrates existing primary clients/lawyers to `case_clients` / `case_lawyers` without removing legacy columns. Create and patch accept `clientIds` and `lawyerIds`; at least one client is required. Legacy single-participant payloads remain supported. Case lists and linked office resources are scoped to assigned lawyers; administrators/owners can access all cases. Removing a participant revokes access to the shared case.

Linked clients share case progress, hearings and case attachments. Payments and receipts remain private to the specified payer (`clientId` is required for multi-client case payment requests). Each client may rate each assigned lawyer once after closure (`lawyerId`). Consultation conversations remain private to their requesting client and assigned respondents.

The office case workspace manages participants and optional opponents (name, phone, email, national ID, relationship, optionally linked to a case client). Opponents and internal activity are available only to staff with case access, not the client portal. Removing a linked client clears opponents' optional client references.

Database triggers record case changes from activation onward, including case membership, opponents, progress, hearings, tasks, documents, payments/receipts, consultations, powers of attorney and reviews. Activity records the authenticated actor and field values before/after changes; binary content and secret tracking tokens are excluded. V10 includes document metadata and records resource transfers in both case histories. Transaction-local actor identity resets when connections return to the pool. Historical actors are not fabricated; deleted case history is retained in the database. No activity mutation API is exposed.

Run `pwsh -NoProfile -File scripts/smoke-case-participants.ps1` with the local app and Docker available to verify membership access, shared files/progress, private payments, opponents, actor audit, ratings and revocation. The script creates and removes synthetic fixtures only.
