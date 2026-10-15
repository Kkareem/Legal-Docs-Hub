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
- Angular `/consultation`: visitors submit a consultation with an email address or phone number. Tracking requires an OTP delivered to that contact; consultation numbers and legacy secret tokens are no longer used for lookup.
- Angular `/consultation-requests`: admins and owners view all visitor requests, reply directly, or assign an active lawyer. Lawyers see and reply only to their own assigned requests. Messages are preserved in order. Once staff replies, staff must wait for the visitor's follow-up; the visitor replies after contact verification, which reopens the staff reply. The backend enforces these turns, including concurrent submissions. Existing replies are preserved by migration V3. Visitor requests are stored separately from existing client consultations.
- Dashboard `totalVisitors` counts distinct browser IDs saved in local storage when the public consultation page opens. Refreshing does not increment the counter; another browser or clearing storage counts as another visitor. Pending consultations include visitor requests.

Consultations support multiple assigned lawyers. Admins select them with checkboxes and always retain access. Only assigned lawyers can see or reply to the request; removing an assignee revokes both permissions. Migration V4 carries existing assignments forward. Each staff message stores the author's name when sent, so later reassignment does not change the names on earlier replies. The conversation still alternates between the office and visitor, with one shared office turn across all assigned lawyers.

With the local PostgreSQL Compose service, backend, and Angular server running, run the API smoke checks from this directory using PowerShell 7:

```powershell
./scripts/smoke-onboarding.ps1
```

The script uses local demo admin credentials by default, verifies onboarding, authorization, assignment, replies, tracking, and visitor deduplication through Angular's proxy, and removes its synthetic fixtures from the local Compose database. Override `AdminEmail` and `AdminPassword` if the demo account has been changed.

## Client portal

- Staff open the Clients page and choose **Create client account**, providing a 14-digit identity, optional email/phone and a temporary password of at least 10 characters. Admins/owners may provision any client; a lawyer may provision a client of a case assigned to them. Existing demo links from client records to staff identities are removed by V5 so that staff accounts are not treated as client logins.
- Clients sign in on the normal login page, must change their temporary password, and are redirected to Angular `/my-account`. The server blocks client accounts from office APIs and scopes portal queries, uploads, downloads, consultations, payments, and reviews to their linked client record.
- From Cases, staff open **Client follow-up, hearings and fees** to publish progress updates, schedule hearings, share files, and request case fees. These actions are restricted to admins/owners and the case's lead lawyer.
- Client and staff case attachments support multiple files of any type: at most 10 per upload, 20 MB each and 50 MB total. All attachments and receipts use `documents`. V7 migrates stored files and receipt references and preserves old download links. Bytes are stored in PostgreSQL, persist with the database volume, and are served as authenticated downloads. Existing document metadata remains visible; a legacy document URL is not automatically imported as stored file content.
- Admins set the office's real bank details under **Bank transfers and receipts**. Clients transfer externally and upload a receipt and transfer reference. A submitted receipt sets the payment to `under_review`, not `paid`. Only admins/owners can approve or reject it; rejection allows a new submission. General payment requests can be created on this page as well.
- Clients can create consultations for their own cases, reply when it is their turn, and see earlier visitor consultations automatically linked by their recorded email or phone when staff creates their account. A shared contact never merges two existing clients.
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


### Attachments stored on the server disk

Files and bank receipts are now stored under `APP_ATTACHMENTS_DIRECTORY` (default `.data/attachments`, relative to the backend working directory). Use an absolute persistent directory in production. PostgreSQL stores only the protected download URL, internal file key and metadata; a database constraint prevents storing new binary content. Downloads retain existing user/case/payment authorization and never expose the storage directory as a public static folder.

At startup, existing database attachments are copied one at a time, verified byte-for-byte and then cleared from the database within a transaction. A failed copy leaves the original bytes intact and fails startup. Failed uploads clean their new disk files on transaction rollback. Deleted document records enqueue disk cleanup, retried every 30 seconds. File names contain the sanitized original name, a unique numeric epoch-millisecond timestamp and the original sanitized extension, in Cases/case_<id>_<caseNumber>/receipts or others.

Back up and restore PostgreSQL **and** the attachments directory together. Moving or deploying the server requires retaining this directory; it is not the visitor's or client's device. Existing download URLs remain unchanged. The legacy nullable `content` column remains for upgrade compatibility, with a validated `content IS NULL` constraint after migration.

Attachment layout: `cases/case_<id>_<case-number>/<name>_<timestamp>_<uuid>.<ext>` for case files; `receipts/case_<id>_<case-number>/payment_<id>/...` for case payment receipts, or `receipts/general/payment_<id>/...` for general payments. Including the internal case ID avoids collisions between duplicate/sanitized case numbers. Flat legacy files are copied, verified and remapped at startup; old copies enter the cleanup queue only after the database mapping commits. Existing public download URLs and original download names remain unchanged. Existing stored folders remain valid if a case number is later renamed.

Current layout: `Cases/case_<id>_<case-number>/receipts/<filename>_<epochMillis>.<extension>` for receipts, and `Cases/case_<id>_<case-number>/others/...` for case attachments. General payments without a case use `Cases/general/receipts`. A monotonic epoch-millisecond long and exclusive file creation/retry prevent collisions without UUID suffixes. Previous layouts are copied, verified and remapped at startup, then queued for cleanup after commit.


## Identity login, unified settings and contact verification

Office Gmail, banking, browser keys and other general configuration use the `settings` table (`name`, JSONB `value`, `updated_at`), preserving encrypted credentials. V14 moves personal notification preferences into `notification_preferences`, keyed by `user_id`, preserving existing channel choices and removing `notifications.user.*` rows from general settings. The old settings tables are removed after copying their data. Settings APIs return only safe fields, never passwords, SMS tokens or signing keys. Currency, bank details, Gmail, SMS, JWT duration and OTP policy are managed from Angular `/settings` by admins/owners; each user manages their own notification channels.

Login now takes `nationalId` (exactly 14 ASCII digits) and `password`. New staff accounts require email or phone; creating a client account requires identity and a temporary password, with either contact optional. Email remains optional and unique if supplied. Existing non-demo users without a valid identity are left unset; an admin must record the real identity in Settings → account identities. Only the development seed logins have example identifiers: `00000000000001` (office owner), `00000000000002` (seed lawyer). Existing passwords are retained.

Authentication uses signed HS256 JWTs (issuer/audience/expiry validation) with a default fixed lifetime of 60 minutes. The web application uses an HttpOnly SameSite=Strict cookie; API clients may use the returned token as Bearer. No token is stored in browser local/session storage. There is no HTTP session or automatic refresh. Logout revokes the token, and changing passwords or admin account changes invalidate prior tokens. New tokens reflect the configured lifetime; active tokens retain their original expiry. Configure `SESSION_COOKIE_SECURE=true` when serving through HTTPS. Browser mutations are checked against the installation's configured origin. Signing keys are encrypted in `settings`, using the existing persistent settings master key file.

Public consultation submission requires email or phone. `/api/public/consultations/verification/request` accepts `contact`; `/verification/verify` accepts `challengeId` and the six-digit `code`. After verification, an in-memory visitor `accessToken` scopes `/track` and `/reply` to only that contact's requests. Default code lifetime is 5 minutes, 5 guesses, a 60-second resend wait, and 15-minute visitor access. OTPs are HMAC hashed, single use, rate limited by contact and server-observed IP, and never logged or returned by APIs. Email uses office Gmail. Phone OTP requires configured Twilio Account SID, Auth Token and sender in Settings; credentials are encrypted and the connector remains disabled until configured. SMS provider charges are separate. Phone delivery has not been tested against a real provider account.

When staff creates a client account, unlinked visitor requests matching its normalized email or phone are linked to that client. Existing ownership is retained and shared contacts are not used to merge accounts. Later visitor requests also attach to an unambiguous existing client. Updating a linked client's contacts through the office account editor triggers the same linking. The manual request-number/token claim form and API have been removed.

Run `scripts/smoke-onboarding.ps1` (optional `-MavenRepository` path) with local PostgreSQL running for JWT/OTP/identity integration checks. These create and remove a unique temporary schema, mock mail delivery and never touch public office records. Ordinary `mvn test` skips these database checks unless `LEGALDESK_INTEGRATION_TESTS=true`. The other portal/participants smoke scripts now use identity login and should run only against a designated test instance. Angular tests run via `node node_modules/@angular/cli/bin/ng.js test --watch=false` from the Angular artifact.


## Run Angular and Java on Docker Desktop

From the repository root:

```powershell
docker compose -f artifacts/api-server-java/compose.yml up -d --build --wait
docker compose -f artifacts/api-server-java/compose.yml ps
```

Open http://localhost:4020. The Java API is available at http://localhost:8080/api/healthz; Angular also proxies `/api` through Nginx on its own origin. Stop the local Angular/Java development servers before using these default ports. To run alongside them, set `FRONTEND_PORT=4021` and `BACKEND_PORT=8081` in `.env` beside the compose file (see `.env.docker.example`).

The stack builds Angular in Node and Java in Maven, then runs Nginx, Java 21 and PostgreSQL 17. Health checks make the backend wait for PostgreSQL and the frontend wait for the backend. The existing `legaldesk-postgres` volume is reused. The backend mounts `legaldesk-app/.data` so existing attachments and the encryption key continue to work; changing containers does not remove files or database data. Keep this directory and PostgreSQL together when moving the office installation. On Linux, the configured data directory must be writable by the container's `legaldesk` user.

```powershell
docker compose -f artifacts/api-server-java/compose.yml stop
docker compose -f artifacts/api-server-java/compose.yml start --wait
docker compose -f artifacts/api-server-java/compose.yml logs --tail 50 backend
```

All accounts (office staff, lawyers and clients) sign in with a 14-digit `nationalId`. Email is contact information only. Legacy accounts without an identity must have their real identity recorded by an administrator in Settings before signing in.

Telephone fields have separate country-code and national-number inputs. They submit a normalized international telephone string to the API, preserving the existing contact matching and consultation linking contract. Egypt uses `+20` and Saudi Arabia uses `+966`; the domestic leading zero is omitted when saving these numbers (`+20` / `01018681448` → `+201018681448`, `+966` / `0551400324` → `+966551400324`). Other country codes remain editable. Phone consultation tracking uses the same input and continues to require SMS verification configuration.


## dev / stg / prod profiles and debugging

The Maven profiles choose the Spring default packaged in the executable jar; an explicit `SPRING_PROFILES_ACTIVE` overrides that default at runtime. `dev` is the default Maven profile. Configuration lives in `application-dev.yml`, `application-stg.yml` and `application-prod.yml`. The legacy `local` Spring profile remains compatible with existing developer commands.

| Profile | Configuration | Seed data | API documentation |
| --- | --- | --- | --- |
| dev | Local PostgreSQL defaults; optional `.env.dev` | Demo data only in an empty database | Enabled |
| stg | Explicit database credentials; isolated staging data | Configured first owner only | Enabled |
| prod | Explicit credentials and public HTTPS URL; secure cookies | Configured first owner only | Disabled |

Build from `artifacts/api-server-java`:

```powershell
mvn -Pdev -pl legaldesk-app -am package
mvn -Pstg -pl legaldesk-app -am package
mvn -Pprod -pl legaldesk-app -am package
```

Choose one profile at a time. All three configuration files are included in the jar; no office passwords are built into an image or jar.

For local run/debug, copy the relevant `.env.dev.example`, `.env.stg.example` or `.env.prod.example` to its name without `.example`, and configure it. The script loads that file, builds/installs the Maven reactor and runs the selected profile:

```powershell
./scripts/run-backend.ps1 -Profile dev
./scripts/run-backend.ps1 -Profile stg -Debug
./scripts/run-backend.ps1 -Profile prod -Debug
```

Optional `-Port 8084` changes the application port; `-DebugPort 5015` changes the debugger port; `-SkipBuild` skips reactor installation. Debug connections bind to loopback: dev 5005, stg 5006, prod 5007. Debugging a locally launched prod profile requires explicitly configured production database access in `.env.prod`; the production Docker database is not published on the host.

VS Code with the Java debugger: select **LegalDesk - dev**, **LegalDesk - stg** or **LegalDesk - prod** in Run and Debug, then press F5. Each launch first runs its matching Maven build task. **Attach Maven - dev/stg/prod** attaches to a backend started with the script's `-Debug` option. In IntelliJ, choose the matching Maven profile and set the Spring run configuration's active profile to the same value.

## Docker for staging and production

Standalone stacks use separate Compose project names, PostgreSQL volumes, attachment volumes and encryption keys. They do not reuse or copy the current development office data. The original `compose.yml` remains a compatibility stack for the existing local installation and runs the stg application profile with its existing data directory.

From `artifacts/api-server-java`:

```powershell
# Edit credentials and first-owner fields before the first start.
Copy-Item .env.stg.example .env.stg
Copy-Item .env.prod.example .env.prod

docker compose --env-file .env.stg -f compose.stg.yml up -d --build --wait
docker compose --env-file .env.prod -f compose.prod.yml up -d --build --wait
```

Staging opens at http://localhost:4021, its backend is on loopback port 8081, and its database is on loopback port 5433. Production Nginx binds to loopback port 4080 and must sit behind the office's HTTPS reverse proxy. Set `APP_PUBLIC_URL` to that HTTPS domain and have the proxy forward the original `Host` and `X-Forwarded-Proto: https`. The backend and PostgreSQL are internal-only in prod; authentication cookies are Secure. The compose files use the correct Maven build profile and explicitly set the matching Spring runtime profile.

For a new empty staging/production database, set `BOOTSTRAP_OWNER_NATIONAL_ID` (14 digits), `BOOTSTRAP_OWNER_PASSWORD` (10-128 characters) and either `BOOTSTRAP_OWNER_EMAIL` or `BOOTSTRAP_OWNER_PHONE`. The account is created once as owner and must change its temporary password on first login. Existing accounts are never changed by bootstrap values. Empty databases without valid bootstrap credentials fail startup with an actionable message. Remove bootstrap secrets from the environment after provisioning the owner.

Keep each environment's PostgreSQL and `legaldesk-files` volumes together when backing up or moving it. Nginx permits multipart uploads of the API's configured size and handles Angular deep links. No debugger port is enabled in either Docker stack.
