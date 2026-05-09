# LegalDesk

LegalDesk is an Arabic-first legal office management platform delivered as a multi-app repository.

The GitHub-ready repository now keeps only the active codebase:

- Java backend: Spring Boot modular monolith
- Web app: React + TypeScript + Vite
- Mobile app: React Native + TypeScript + Expo
- Shared frontend/data libraries: API client, OpenAPI spec, Zod contracts, and DB schema packages

## Active Repository Structure

```text
artifacts/
  api-server-java/       # Active Java backend
  legal-desk/            # Active web app
  legal-desk-mobile/     # Active mobile app
docs/
  architecture/
  history/
  integration/
  mobile/
  reference/
  release/
lib/
  api-client-react/
  api-spec/
  api-zod/
  db/
package.json
pnpm-workspace.yaml
```

## Technology Stack

- Backend: Java 21, Spring Boot 4, Spring Security, Spring Data JPA, Flyway
- Web: React 19, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS
- Mobile: Expo, React Native, TypeScript, Expo Router, TanStack Query
- Shared packages: OpenAPI-driven API client generation, Zod schemas, DB schema package

## Quick Start

### Backend

From `artifacts/api-server-java/legaldesk-app`:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### Web

From the repository root:

```bash
pnpm --filter @workspace/legal-desk dev
```

Required local environment variables for the web app:

```bash
PORT=4017
BASE_PATH=/
API_PROXY_TARGET=http://127.0.0.1:8015
```

### Mobile

From the repository root:

```bash
pnpm --filter @workspace/legal-desk-mobile exec expo start --web --port 4015
```

Recommended local environment variable:

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8015/api
```

For a real device, replace `127.0.0.1` with the machine LAN IP.

## Documentation

Start here:

- [Documentation Index](docs/README.md)
- [Release Readiness](docs/release/release-readiness.md)
- [System Diagrams](docs/architecture/system-diagrams.md)
- [Frontend / Backend Service Map](docs/integration/frontend-backend-service-map.md)
- [Mobile App Handoff](docs/mobile/mobile-app-java-backend-handoff.md)

## Repository Cleanup Notes

Legacy, prototype, Replit-local, and Codex-local content was moved out of this GitHub-ready repository into a local sibling archive during cleanup. The active repo intentionally excludes:

- old Node/Express backend
- mockup sandbox prototype
- local automation and Codex state folders
- transient logs
- Replit-only files
- placeholder local scripts

## Release Intent

This repository is now organized for a professional GitHub release focused on the active product code and durable engineering documentation rather than local workstation artifacts.
