# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## About PD Local

PD Local is a web app for Parkinson's patients and caregivers. It is always free
to use. Information and guidance is available to all, even when not logged in.
Users can register with a physical address to connect with others in the same
general location.

## Guiding Principles

- **Accessibility (a11y) in everything.** Users are often challenged by small
  motor tasks like operating a keyboard or mouse — every feature must be fully
  accessible.
- **Privacy** — handle user data with care.
- **No ads.**
- **Free to use forever** — supported by donations and grants, never by
  monetizing users.

## Stack

This is an **Epic Stack** application using React Router v7 (SSR), Express,
Prisma (SQLite), Tailwind CSS v4, Vitest, and Playwright. It deploys to Fly.io
with LiteFS for SQLite replication across regions.

## Commands

```sh
npm run dev          # Start dev server with MSW mocks enabled
npm run dev:no-mocks # Start dev server without mocks (hits real APIs)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # react-router typegen + tsc
npm run format       # Prettier

# Tests
npm test             # Vitest (watch mode)
npm run coverage     # Vitest with coverage
npm run test:e2e:dev # Playwright with UI (requires dev server or separate build)
npm run test:e2e:run # Playwright headless (builds first)

# Run a single Vitest test file
npx vitest run app/utils/auth.server.test.ts

# Database
npx prisma migrate dev --name <migration-name>
npx prisma generate --sql
npx prisma db seed
npx prisma studio
```

Before running tests for the first time: `cp .env.example .env`

## Architecture

### Server Entry & Request Pipeline

`index.ts` → loads `dotenv`, optionally activates MSW mocks (when `MOCKS=true`),
then starts `server/index.ts`. The Express app (`server/app.ts`) wraps React
Router's `createRequestHandler`. The `MOCKS` flag is set automatically in
`npm run dev`.

### Routing

Routes are file-based via `react-router-auto-routes` in `app/routes/`. The
top-level groups:

- `_auth/` — login, signup, verify, forgot/reset password, GitHub OAuth,
  WebAuthn
- `_marketing/` — public marketing/landing pages
- `_seo/` — SEO-related routes
- `admin/` — admin panel (cache management, etc.)
- `settings/profile/` — user profile settings
- `resources/` — resource-only routes: `healthcheck`, `theme-switch`, `images`,
  `download-user-data`
- `users/` — user profiles and notes

Files suffixed `.server.ts` / `.client.ts` inside a route folder are co-located
utilities, not routes.

### Utils Conventions (`app/utils/`)

- `*.server.ts` — server-only (never bundled into client)
- `*.client.ts` — client-only
- `db.server.ts` — singleton Prisma client
- `auth.server.ts` — session/auth helpers (`getUserId`, `requireUserId`,
  `requireUser`)
- `permissions.server.ts` — RBAC helpers (`requireUserWithPermission`,
  `requireUserWithRole`)
- `cache.server.ts` — two-layer cache: LRU in-memory + SQLite via
  `@epic-web/cachified`
- `storage.server.ts` — Tigris (S3-compatible) file upload for user/note images
- `session.server.ts` — cookie session storage
- `toast.server.ts` — flash toast messages via session
- `env.server.ts` — Zod-validated env vars; `getEnv()` returns the safe public
  subset for the client

### Authentication

Three mechanisms: username/password (bcrypt), GitHub OAuth (`remix-auth` +
`remix-auth-github`), and Passkeys (SimpleWebAuthn). Email verification uses
TOTP (`@epic-web/totp`). Sessions are stored in the DB with 30-day expiry.

In development, GitHub auth is intercepted by MSW when `GITHUB_CLIENT_ID` starts
with `MOCK_`.

### Permissions (RBAC)

Permissions follow the format `"action:entity"` or `"action:entity:access"`
(e.g. `"update:note:own"`). Use
`requireUserWithPermission(request, 'update:note:own')` in loaders/actions.
Roles and permissions are seeded in `prisma/seed.ts`.

### Caching

The cache uses LRU for hot data and a SQLite cache DB (`CACHE_DATABASE_PATH`)
for persistence. In Vitest, `cache.server.ts` is replaced by
`tests/mocks/cache-server.ts` (see `vite.config.ts`).

### File Storage (Images)

User and note images are stored in Tigris object storage (S3-compatible). Keys
are stored in the DB (`objectKey` field). The `resources/images` route serves
them via `openimg`. Required env vars: `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ENDPOINT_URL_S3`, `BUCKET_NAME`.

### Icons

SVG source icons live in `other/svg-icons/`. They are compiled into an SVG
sprite at `app/components/ui/icons/sprite.svg` by
`vite-plugin-icons-spritesheet` at build time. Import and use via
`app/components/ui/icon.tsx`.

### UI Components

Radix UI primitives wrapped with Tailwind in `app/components/ui/`. Forms use
`@conform-to/react` + `@conform-to/zod` for type-safe validation. Toasts use
`sonner`.

### Testing

- **Vitest**: unit/component tests co-located in `app/**/*.test.{ts,tsx}`. Setup
  in `tests/setup/`. Console errors and warnings throw by default — mock them
  explicitly if expected.
- **Playwright**: E2E tests in `tests/e2e/`. Use the `login` fixture
  (`tests/playwright-utils.ts`) for authenticated tests — it creates and
  auto-cleans a test user.
- **MSW**: HTTP mocks in `tests/mocks/` (GitHub, Resend, HaveIBeenPwned). Active
  in dev when `MOCKS=true` and always in Vitest.

## React Guidelines

Avoid `useEffect` for derived state, side effects from events, or anything that
can be done with ref callbacks, event handlers with `flushSync`, CSS, or
`useSyncExternalStore`. See `.cursor/rules/` for examples. `useEffect` is
appropriate for subscriptions and external DOM integrations.

## Environment Variables

All env vars are validated at startup via Zod in `app/utils/env.server.ts`.
Optional vars (Sentry, Resend, GitHub) are marked `.optional()` — remove
`.optional()` when you add the real keys. Only vars returned by `getEnv()` are
exposed to the client.
