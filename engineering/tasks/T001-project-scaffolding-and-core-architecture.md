# T001 — Project Scaffolding and Core Architecture

| Field | Value |
| --- | --- |
| ID | T001 |
| Status | Done |
| Area | Foundation / Architecture |
| Depends on | None |
| PRDs | [P007](../../prds/P007-loan-period.md), [P009](../../prds/P009-late-fine.md) |
| TDRs | [T001](../../tdrs/T001-nextjs-16-framework.md), [T003](../../tdrs/T003-server-actions-for-mutations.md), [T005](../../tdrs/T005-zod-validation.md), [T006](../../tdrs/T006-layered-architecture.md), [T007](../../tdrs/T007-tailwind-css-v4.md) |
| Open questions | 0 of 0 |

## What

Initialize the Next.js 16 application, establish the four-layer directory structure defined in [`../architecture.md`](../architecture.md), enforce startup environment validation with Zod, and build the shared cross-cutting contracts (`DomainError`, Server Action result types, and `Africa/Cairo` calendar-day math).

## Why

The repository currently contains only product, technical, and design specifications with no runnable application code. Every feature task (database setup, authentication, catalog browsing, borrowing, returns, and fines) depends on a single Next.js 16 project layout, strict four-layer boundaries (`Presentation` → `Actions` → `Service` → `Repository`), typed domain error codes for bilingual UI messages, and deterministic `Africa/Cairo` calendar-day calculations for 14-day loans (P007) and 5 EGP/day late fines (P009). Introducing this foundational task first prevents ad-hoc folder structures, timezone drift bugs, and inconsistent error handling in downstream tasks.

## How

### 1. Next.js 16 + Tailwind CSS v4 initialization (T001, T007)

- Initialize the project with `npx create-next-app@latest` using:
  - TypeScript enabled (strict mode).
  - App Router (`src/app/`).
  - Tailwind CSS v4 (`@tailwindcss/postcss`, CSS-first config in `src/app/globals.css`, no `tailwind.config.js`).
  - `@/*` import alias mapped to `./src/*`.
- Install core foundational packages: `zod` (T005) and `server-only` (T003, T006).

### 2. Four-layer directory structure (T006)

Create the canonical folder layout from [`../architecture.md`](../architecture.md):

```
src/
├── app/            # Layer 1: Presentation (App Router pages & layouts)
├── components/     # Layer 1: Presentation (app components)
│   └── ui/         #          shadcn/ui base components
├── actions/        # Layer 2: Server Actions (*.actions.ts) & server-only queries (*.queries.ts)
├── services/       # Layer 3: Business rules (plain TypeScript, no Next.js/Prisma imports)
├── repositories/   # Layer 4: Prisma data access
├── schemas/        # Shared Zod schemas and inferred input types
├── i18n/           # next-intl routing and request configuration
└── lib/            # Cross-cutting helpers (errors, dates, session, env, utils)
```

### 3. Shared Schemas & Utilities — Environment validation (`src/schemas/env.schema.ts` & `src/lib/env.ts`)

- Validate required environment variables (`DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`) at startup using Zod (T005).
- Provide a `.env.example` file documenting required variables without committing secrets (T002).

### 4. Shared Utilities — Domain errors and action result contracts (`src/lib/errors.ts`)

- Implement `DomainError` with typed error codes (T010, [`../architecture.md`](../architecture.md)):
  - Auth & roles: `UNAUTHORIZED`, `FORBIDDEN`, `EMAIL_ALREADY_IN_USE`, `INVALID_CREDENTIALS`
  - Catalog & borrowing: `BOOK_NOT_FOUND`, `BOOK_UNAVAILABLE`, `LOAN_LIMIT_REACHED`, `ALREADY_BORROWED_BOOK`, `HAS_OVERDUE_LOANS`, `HAS_UNPAID_FINES`
  - Returns & fines: `LOAN_NOT_FOUND`, `LOAN_ALREADY_RETURNED`, `FINE_NOT_FOUND`, `FINE_ALREADY_PAID`
- Define standard action return types for Server Actions (T003, T005):
  - `{ ok: true, data: T }`
  - `{ ok: false, error: DomainErrorCode, fieldErrors?: Record<string, string[]> }`

### 5. Shared Utilities — Cairo time-zone date helpers (`src/lib/dates.ts`)

- Implement pure date helpers anchored to `Africa/Cairo` (P007, P009, T002):
  - `getCairoToday()`: returns today's calendar date in `Africa/Cairo`.
  - `calculateDueDate(borrowedAt: Date)`: returns `borrow date (Cairo) + 14 calendar days` (P007).
  - `calculateDaysLate(dueDate: Date | string, referenceDate: Date)`: returns whole calendar days past `dueDate` in `Africa/Cairo` (`max(0, referenceDateCairo - dueDate)`) (P009).
  - `calculateDaysRemaining(dueDate: Date | string, referenceDate: Date)`: supports "Due soon" (≤ 2 days) and overdue status calculations (P011).
  - `calculateFineEgp(daysLate: number, dailyRateEgp = 5)`: integer math (`daysLate * 5`) returning whole EGP (P009, T002).

### Architectural & Database Rules to Enforce

- `src/services/` and `src/lib/dates.ts` / `src/lib/errors.ts` must not import from `next/*` or `@prisma/client` (T006).
- No Pages Router (`pages/`) or API Route Handlers (`app/**/route.ts`) (T001, T003).

## Acceptance Criteria

- [x] `npm run build` and `npm run lint` succeed on the scaffolded Next.js 16 project.
- [x] All four architecture layer directories exist and match [`../architecture.md`](../architecture.md).
- [x] Missing or invalid `DATABASE_URL` fails fast with a clear Zod validation error at startup.
- [x] `calculateDueDate` adds 14 calendar days in `Africa/Cairo` time (e.g. `2026-10-01` → `2026-10-15`, `2026-10-20` → `2026-11-03` per P007).
- [x] `calculateDaysLate` and `calculateFineEgp` match all examples in P009 (0 days → 0 EGP, 1 day → 5 EGP, 5 days → 25 EGP, 30 days → 150 EGP).

## Open Questions

_None — all requirements are specified in T001, T003, T005, T006, T007, P007, P009, and `engineering/architecture.md`._
