# T002 — Database Schema, Prisma ORM, Constraints, and Seed

| Field | Value |
| --- | --- |
| ID | T002 |
| Status | Done |
| Area | Data / Repository Layer |
| Depends on | [T001](T001-project-scaffolding-and-core-architecture.md) |
| PRDs | [P001](../../prds/P001-member-registration.md), [P003](../../prds/P003-librarian-role.md), [P004](../../prds/P004-catalog-browsing.md), [P005](../../prds/P005-book-availability.md), [P006](../../prds/P006-max-concurrent-loans.md), [P007](../../prds/P007-loan-period.md), [P008](../../prds/P008-book-return.md), [P009](../../prds/P009-late-fine.md), [P010](../../prds/P010-fine-settlement.md) |
| TDRs | [T002](../../tdrs/T002-postgresql-database.md), [T004](../../tdrs/T004-prisma-orm.md), [T006](../../tdrs/T006-layered-architecture.md) |
| Open questions | 0 of 0 |

## What

Configure Prisma ORM against PostgreSQL, implement the five core relational tables (`users`, `books`, `copies`, `loans`, `fines`) and all custom PostgreSQL integrity constraints and indexes defined in [`../database.md`](../database.md), expose the single Prisma client and `withTransaction` helper in `src/repositories/db.ts`, and provide an idempotent seed script.

## Why

Borrowing scarce physical copies and tracking money (late fines in EGP) require strict ACID guarantees at the database level so race conditions or application bugs can never double-lend a copy, allow a member to hold two active loans of the same book, or record invalid fine math. In addition, because public registration only creates `MEMBER` accounts (P003), the database needs a repeatable seed script to provision the initial `LIBRARIAN` account and sample catalog copies before authentication and catalog tasks can be tested.

## How

### 1. Database & Schema — Prisma ORM setup (`prisma/schema.prisma`) (T004)

- Initialize Prisma configured for PostgreSQL using `DATABASE_URL` (T002, T004).
- Define the `UserRole` enum (`MEMBER`, `LIBRARIAN` mapped to `user_role`) and the five models mapped to `snake_case` plural table names (`@@map`) and `snake_case` columns (`@map`):
  - `User` (`users`): `id` (UUID), `fullName`, `email` (`@db.Citext`, unique), `passwordHash`, `role` (default `MEMBER`), `createdAt`, `updatedAt`.
  - `Book` (`books`): `id` (UUID), `title`, `author`, `description`, `isbn` (nullable, unique), `coverImageUrl` (nullable), `createdAt`, `updatedAt`.
  - `Copy` (`copies`): `id` (UUID), `bookId` (FK → `books.id`, `onDelete: Restrict`), `barcode` (unique), `withdrawnAt` (nullable `timestamptz`), `createdAt`.
  - `Loan` (`loans`): `id` (UUID), `memberId` (FK → `users.id`), `bookId` (FK → `books.id`), `copyId` (FK → `copies.id`), `borrowedAt` (`timestamptz`), `dueDate` (`@db.Date`), `returnedAt` (nullable `timestamptz`), `returnedById` (nullable FK → `users.id`).
  - `Fine` (`fines`): `id` (UUID), `loanId` (FK → `loans.id`, unique), `daysLate` (`Int`), `dailyRateEgp` (`Int`), `amountEgp` (`Int`), `createdAt` (`timestamptz`), `paidAt` (nullable `timestamptz`), `receivedById` (nullable FK → `users.id`).
- Set `onDelete: Restrict` on all foreign keys so history is never deleted (`database.md`).

### 2. Database & Schema — Custom SQL constraints & indexes (`prisma/migrations/`)

Edit the initial migration SQL (before applying or in a dedicated constraint migration) to include PostgreSQL features and constraints not directly expressible in `schema.prisma` ([`../database.md`](../database.md), T002, T004):

- **Extensions:**
  - `CREATE EXTENSION IF NOT EXISTS citext;`
  - `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- **Partial unique indexes:**
  - One active loan per copy (P005):
    `CREATE UNIQUE INDEX loans_one_active_per_copy_idx ON loans (copy_id) WHERE returned_at IS NULL;`
  - One active loan per book per member (P006-Q1):
    `CREATE UNIQUE INDEX loans_one_active_per_book_member_idx ON loans (member_id, book_id) WHERE returned_at IS NULL;`
- **Composite FK for copy-book consistency:**
  - `UNIQUE (id, book_id)` on `copies` and composite FK `loans (copy_id, book_id) REFERENCES copies (id, book_id)`.
- **`CHECK` constraints:**
  - `loans`: `returned_at IS NULL OR returned_at >= borrowed_at`
  - `loans`: `(returned_at IS NULL) = (returned_by_id IS NULL)` (P008-Q1)
  - `fines`: `days_late > 0 AND daily_rate_egp > 0` (P009)
  - `fines`: `amount_egp = days_late * daily_rate_egp` (P009)
  - `fines`: `(paid_at IS NULL) = (received_by_id IS NULL)` (P010-Q1)
- **Performance & search indexes:**
  - `loans (member_id) WHERE returned_at IS NULL`
  - `loans (due_date) WHERE returned_at IS NULL`
  - `fines (loan_id) WHERE paid_at IS NULL`
  - `copies (book_id)`
  - GIN trigram (`gin_trgm_ops`) indexes on `books.title` and `books.author` (P004-Q1).

### 3. Layer 4 — Single Prisma client and transaction helper (`src/repositories/db.ts`)

- Export the singleton Prisma client instance (guarded on `globalThis` in development) (T004).
- Mark `src/repositories/db.ts` with `import "server-only"`.
- Export a `DbClient` type (accepting either the root Prisma client or a transaction client) and a `withTransaction` helper so services can run multi-step operations atomically without importing `@prisma/client` directly (T006, [`../architecture.md`](../architecture.md)).

### 4. Database Seed (`prisma/seed.ts`)

- Seed idempotently:
  - 1 `LIBRARIAN` account (required by P003 since public sign-up only creates `MEMBER`s).
  - 1 demo `MEMBER` account.
  - 5–8 books across Arabic and English titles with multiple copies (including a book with multiple available copies and a book with 0 available copies to verify P004 and P005).

### Architectural & Database Rules to Enforce

- Only files inside `src/repositories/` (and `prisma/seed.ts`) may import `@prisma/client` (T004, T006).
- No `is_available` column on `copies` or `books`; availability is derived from `withdrawn_at IS NULL` and no active loan (`returned_at IS NULL`) (`database.md`).
- Money columns (`daily_rate_egp`, `amount_egp`) are `integer`, never floats/decimals (T002).

## Acceptance Criteria

- [x] `npx prisma migrate dev` applies cleanly against a fresh PostgreSQL database.
- [x] Database rejects inserting two active loans (`returned_at IS NULL`) for the same `copy_id` (P005).
- [x] Database rejects inserting two active loans (`returned_at IS NULL`) for the same `(member_id, book_id)` (P006-Q1).
- [x] Database rejects a loan where `returned_at` is set without `returned_by_id` (P008-Q1), or a fine where `amount_egp != days_late * daily_rate_egp` (P009).
- [x] `npx prisma db seed` populates the initial librarian, demo member, books, and copies idempotently.

## Open Questions

_None — all schema tables, columns, constraints, indexes, and transactions are specified in `engineering/database.md`, T002, and T004._
