# LegalDesk — Legal Office Management Platform

## Overview

Full-stack SaaS for Arabic law firms. pnpm workspace monorepo with TypeScript, React/Vite frontend (Arabic RTL UI, navy/gold palette), Express 5 backend, PostgreSQL + Drizzle ORM.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Wouter + TanStack Query + shadcn/ui
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Build**: esbuild (CJS bundle for API server)
- **Auth**: express-session + bcryptjs (cookie-based sessions)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Artifacts

- `artifacts/api-server` — Express API server (`/api/*` routes)
- `artifacts/legal-desk` — React frontend (root `/`)

## Database Schema (11 tables)

users, clients, cases, documents, tasks, hearings, consultations, payments, powers_of_attorney, notifications, audit_logs

## Seed Credentials

- **Admin**: admin@legaldesk.sa / password123
- **Lawyer**: fatima@legaldesk.sa / password123
- **Assistant**: mohammed@legaldesk.sa / password123

## Frontend Pages

dashboard (with recharts BarChart + PieChart), clients, client-detail, cases, case-detail (status editing + inline document add), tasks (mark done), hearings, consultations, payments (mark paid), powers-of-attorney, users, notifications (mark read/all), documents, profile

## Important Notes

- `lib/api-client-react/src/custom-fetch.ts` — uses `credentials: 'include'` so session cookies are sent with every request
- `lib/api-spec/package.json` — codegen script patches `lib/api-zod/src/index.ts` to only export `./generated/api` (prevents TS2308 duplicate export error)
- All form mutation calls use `as any` cast since form state uses `string` but API expects literal union types
- Session cookie: `secure: false` in dev, `secure: true` in production
- CORS: `credentials: true`, `origin: true`
