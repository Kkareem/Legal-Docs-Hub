# Release Readiness

This document records the final GitHub-ready cleanup state for the LegalDesk repository.

## 1. Pre-Push Exclusion Plan

The following content must stay out of the GitHub-ready repository:

- legacy applications that are no longer active
- prototypes and mockup sandboxes
- local Codex and agent state
- local logs and runtime traces
- Replit-only files
- build output and generated runtime artifacts
- local environment files and secrets
- transient package installation directories

During cleanup, legacy and local-only content was moved to a sibling local archive outside this repository rather than being deleted in-place.

## 2. Final Include List

The GitHub-ready repository includes:

- `artifacts/api-server-java`
- `artifacts/legal-desk`
- `artifacts/legal-desk-mobile`
- `lib/api-client-react`
- `lib/api-spec`
- `lib/api-zod`
- `lib/db`
- `docs`
- root workspace files:
  - `package.json`
  - `pnpm-workspace.yaml`
  - `pnpm-lock.yaml`
  - `tsconfig.base.json`
  - `tsconfig.json`
  - `.npmrc`
  - `.gitignore`
  - `README.md`

## 3. Final Exclude List

Excluded from the GitHub-ready repository:

- `.agents`
- `.codex-bin`
- `.codex-logs`
- `.local`
- `.replit`
- `.replitignore`
- `artifacts/api-server`
- `artifacts/mockup-sandbox`
- `scripts`
- local `node_modules`
- `dist`, `target`, `.expo`, and similar build/runtime folders
- local `.env*` files and secrets

## 4. Active App Summary

### Backend

- Active app: `artifacts/api-server-java`
- Stack: Java + Spring Boot

### Web

- Active app: `artifacts/legal-desk`
- Stack: React + TypeScript + Vite

### Mobile

- Active app: `artifacts/legal-desk-mobile`
- Stack: React Native + TypeScript + Expo

## 5. GitHub Push Checklist

Before the first push:

1. Confirm `git status` only shows intended active files and documented deletions.
2. Confirm no `.env`, credentials, keys, or local database files are staged.
3. Confirm no `node_modules`, `dist`, `target`, `.expo`, or logs are staged.
4. Confirm the root `README.md` renders correctly.
5. Confirm `docs/README.md` links are valid.
6. Confirm active apps still build locally if you want one final verification pass.
7. Review staged deletions so only legacy/local content is being removed from the repo.

## 6. Suggested Final Verification Commands

```bash
git status
pnpm run typecheck
pnpm run build
```

For backend verification:

```bash
cd artifacts/api-server-java
mvn -q -DskipTests package
```

## 7. First Commit and Push Commands

Replace `<your-github-url>` and `<branch>` as needed:

```bash
git add .
git status
git commit -m "chore: prepare LegalDesk repository for GitHub release"
git branch -M main
git remote add origin <your-github-url>
git push -u origin main
```

If the remote already exists:

```bash
git remote set-url origin <your-github-url>
git push -u origin main
```
