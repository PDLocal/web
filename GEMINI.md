# GEMINI.md

This file provides instructions and context for Gemini CLI when working in this
repository.

## Project Overview: PD Local

PD Local is a web application built for Parkinson's patients and caregivers. It
prioritizes accessibility, privacy, and is free to use.

## Guiding Principles

- **Accessibility (a11y) First:** Interfaces must be navigable for users with
  motor challenges.
- **Privacy & Security:** Handle user data with extreme care; follow existing
  patterns for RBAC and session management.
- **No Monetization:** No ads, no data selling.

## Tech Stack

- **Framework:** React Router v7 (SSR) - Epic Stack
- **Server:** Express
- **Database:** Prisma (SQLite) with LiteFS for replication
- **Styling:** Tailwind CSS v4
- **Testing:** Vitest (Unit/Integration), Playwright (E2E)
- **Email:** Resend
- **Object Storage:** Tigris (S3-compatible)

## Essential Commands

### Development & Build

- `npm run dev`: Start dev server with MSW mocks.
- `npm run build`: Production build.
- `npm run lint`: Run ESLint.
- `npm run typecheck`: TypeScript and React Router type generation.
- `npm run format`: Prettier formatting.

### Testing

- `npm test`: Run Vitest in watch mode.
- `npx vitest run <path>`: Run a specific test file.
- `npm run test:e2e:run`: Run Playwright E2E tests (headless).

### Database

- `npx prisma migrate dev --name <name>`: Create a new migration.
- `npx prisma generate --sql`: Generate typed SQL queries.
- `npx prisma db seed`: Seed the database.

## Architecture & Conventions

### Directory Structure

- `app/routes/`: File-based routing (React Router v7).
- `app/components/`: UI components (Radix + Tailwind).
- `app/utils/`: Core utilities (Auth, DB, Cache, etc.).
- `server/`: Express server logic.
- `tests/`: Test setup, mocks, and E2E tests.

### Core Utilities (`app/utils/`)

- `*.server.ts`: Server-only code (enforced by `vite-plugin-server-only`).
- `auth.server.ts`: Authentication and session helpers (`requireUserId`).
- `permissions.server.ts`: RBAC helpers (`requireUserWithPermission`).
- `db.server.ts`: Prisma client singleton.
- `toast.server.ts`: Flash messages via session.

### Formatting & Style

- Follow Prettier and ESLint rules.
- Avoid `useEffect` for derived state or side effects that can be handled in
  event handlers or during rendering.
- Ensure all new components are accessible (check ARIA labels, keyboard
  navigation).

## Working with Gemini

- **Research First:** Always check existing patterns in `app/utils/` and
  `app/components/` before implementing new logic.
- **Testing:** Add Vitest tests for utilities and Playwright tests for user
  flows.
- **Commits:** Do not stage or commit changes unless explicitly asked.
- **Context:** Use `grep_search` to find relevant code before making changes.
