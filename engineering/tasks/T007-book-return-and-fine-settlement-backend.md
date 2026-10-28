# T007 — Book Returns and Late Fine Settlement Backend

| Field | Value |
| --- | --- |
| ID | T007 |
| Status | Done |
| Area | Returns & Fines (Backend — Layers 2, 3 & 4 without UI) |
| Depends on | [T001](T001-project-scaffolding-and-core-architecture.md), [T002](T002-database-schema-and-prisma-setup.md), [T004](T004-authentication-and-role-access.md), [T006](T006-book-borrowing-and-eligibility-backend.md) |
| PRDs | [P003](../../prds/P003-librarian-role.md), [P005](../../prds/P005-book-availability.md), [P006](../../prds/P006-max-concurrent-loans.md), [P007](../../prds/P007-loan-period.md), [P008](../../prds/P008-book-return.md), [P009](../../prds/P009-late-fine.md), [P010](../../prds/P010-fine-settlement.md) |
| TDRs | [T002](../../tdrs/T002-postgresql-database.md), [T003](../../tdrs/T003-server-actions-for-mutations.md), [T004](../../tdrs/T004-prisma-orm.md), [T005](../../tdrs/T005-zod-validation.md), [T006](../../tdrs/T006-layered-architecture.md) |
| Open questions | 0 of 2 |

## What

Implement the complete backend (Layer 4 Repositories, Shared Zod Schemas, Layer 3 Services, and Layer 2 Server Actions & Queries—without Layer 1 UI) for librarian-recorded book returns (P008), atomic late-fine calculation and creation at 5 EGP per calendar day late in `Africa/Cairo` time (P009), and in-person fine payment settlement (P010).

## Why

Returning a physical book closes an active loan, frees the copy for other members (P005), frees one of the member's 3 loan slots (P006), and finalizes any late fine (P008, P009). Because returns and fine settlements involve physical handoff and cash collection in Egyptian pounds, only a `LIBRARIAN` may execute them (P003, P008-Q1, P010-Q1), and closing a late loan must atomically create its `fines` record in the same database transaction ([`../database.md`](../database.md)). Separating return and fine-settlement backend logic into T007 keeps each task focused on one stage of the loan lifecycle while completing all server-side loan operations.

## How

### 1. Layer 4 — Loan & Fine Repositories (`src/repositories/loan.repository.ts`, `src/repositories/fine.repository.ts`) (T004, T006)

- **`src/repositories/loan.repository.ts`** (extend from T006):
  - `findLoanById(loanId: string, tx?: DbClient)`: returns the loan record (`id`, `memberId`, `bookId`, `copyId`, `borrowedAt`, `dueDate`, `returnedAt`, `returnedById`), or `null`.
  - `markLoanReturned(params: { loanId: string; returnedAt: Date; returnedById: string }, tx?: DbClient)`: executes an atomic conditional update (`WHERE id = :loanId AND returned_at IS NULL`) setting `returnedAt` and `returnedById` (P008, `database.md`). Returns whether a row was updated so concurrent duplicate return clicks cannot double-close a loan.
  - `findAllActiveLoans(tx?: DbClient)`: returns all active loans (`returnedAt IS NULL`) across members with member (`id`, `fullName`, `email`), book (`id`, `title`, `author`), and copy (`barcode`) details, ordered by `dueDate ASC` for librarian inspection (P003, P008).
- **`src/repositories/fine.repository.ts`** (extend from T006):
  - `createFine(data: { loanId: string; daysLate: number; dailyRateEgp: number; amountEgp: number }, tx?: DbClient)`: inserts a row in `fines` (where `amountEgp = daysLate * dailyRateEgp` and `daysLate > 0`) (P009, `database.md`).
  - `findFineById(fineId: string, tx?: DbClient)`: returns the fine record (`id`, `loanId`, `daysLate`, `dailyRateEgp`, `amountEgp`, `createdAt`, `paidAt`, `receivedById`), or `null`.
  - `markFinePaid(params: { fineId: string; paidAt: Date; receivedById: string }, tx?: DbClient)`: executes an atomic conditional update (`WHERE id = :fineId AND paid_at IS NULL`) setting `paidAt` and `receivedById` (P010, `database.md`).
  - `findUnpaidFines(tx?: DbClient)`: returns all unpaid fines (`paidAt IS NULL`) joined with loan, member (`id`, `fullName`, `email`), and book (`title`) details for librarian management (P003, P010).

### 2. Shared Schemas (`src/schemas/loan.schema.ts`, `src/schemas/fine.schema.ts`) (T005)

- `recordReturnSchema` (`src/schemas/loan.schema.ts`): validates `{ loanId: z.string().uuid() }`.
- `markFinePaidSchema` (`src/schemas/fine.schema.ts`): validates `{ fineId: z.string().uuid() }`.
- Export inferred input types `RecordReturnInput` and `MarkFinePaidInput`.

### 3. Layer 3 — Loan & Fine Services (`src/services/loan.service.ts`, `src/services/fine.service.ts`) (T006)

- **`loanService.recordReturn(actor: SessionUser, loanId: string)`** (`src/services/loan.service.ts`):
  - Assert `actor.role === "LIBRARIAN"`, else throw `DomainError("FORBIDDEN")` (P003, P008-Q1).
  - Run inside `withTransaction(async (tx) => { ... })` ([`../database.md`](../database.md)):
    1. Fetch loan via `loanRepository.findLoanById(loanId, tx)` → if not found, throw `DomainError("LOAN_NOT_FOUND")`.
    2. If `loan.returnedAt !== null`, throw `DomainError("LOAN_ALREADY_RETURNED")`.
    3. Set `returnedAt = new Date()` and call `loanRepository.markLoanReturned({ loanId, returnedAt, returnedById: actor.id }, tx)`. If not updated (concurrent return), throw `DomainError("LOAN_ALREADY_RETURNED")`.
    4. Compute `daysLate = calculateDaysLate(loan.dueDate, returnedAt)` in `Africa/Cairo` time (`src/lib/dates.ts`, P007, P009).
    5. If `daysLate > 0`:
       - Compute `dailyRateEgp = 5` and `amountEgp = calculateFineEgp(daysLate, dailyRateEgp)` (`daysLate * 5`, P009).
       - Call `fineRepository.createFine({ loanId, daysLate, dailyRateEgp, amountEgp }, tx)`.
    6. Return the updated loan and created fine (or `fine: null` when returned on or before `dueDate`).
- **`loanService.listAllActiveLoans(actor: SessionUser)`**:
  - Assert `actor.role === "LIBRARIAN"`, else throw `DomainError("FORBIDDEN")` (P003).
  - Fetch active loans from `loanRepository.findAllActiveLoans()` and enrich each with `daysRemaining`, `daysLate`, `isOverdue`, and `runningFineEgp` in `Africa/Cairo` time (P009, P011).
- **`fineService.settleFine(actor: SessionUser, fineId: string)`** (`src/services/fine.service.ts`):
  - Assert `actor.role === "LIBRARIAN"`, else throw `DomainError("FORBIDDEN")` (P003, P010-Q1).
  - Fetch fine via `fineRepository.findFineById(fineId)` → if not found, throw `DomainError("FINE_NOT_FOUND")`.
  - If `fine.paidAt !== null`, throw `DomainError("FINE_ALREADY_PAID")`.
  - Call `fineRepository.markFinePaid({ fineId, paidAt: new Date(), receivedById: actor.id })`. If not updated (concurrent settlement), throw `DomainError("FINE_ALREADY_PAID")`.
  - Return the settled fine.
- **`fineService.listUnpaidFines(actor: SessionUser)`**:
  - Assert `actor.role === "LIBRARIAN"`, else throw `DomainError("FORBIDDEN")` (P003).
  - Return all unpaid fines with member and loan details (P010).

### 4. Layer 2 — Return & Fine Server Actions and Queries (`src/actions/`) (T003, T005, T006)

- **`src/actions/loan.actions.ts` (`"use server"`)** (extend from T006):
  - `recordReturnAction(input)`:
    1. Authenticate and check role with `requireLibrarian()` (P002, P003, P008-Q1).
    2. Validate input with `recordReturnSchema` (T005).
    3. Call `loanService.recordReturn(librarian, parsed.loanId)`.
    4. Revalidate `/[locale]/books`, `/[locale]/loans`, and `/[locale]/admin`, and return `{ ok: true, data }`.
    5. Catch `DomainError` and return `{ ok: false, error: err.code }`.
- **`src/actions/fine.actions.ts` (`"use server"`)**:
  - `markFinePaidAction(input)`:
    1. Authenticate and check role with `requireLibrarian()` (P002, P003, P010-Q1).
    2. Validate input with `markFinePaidSchema` (T005).
    3. Call `fineService.settleFine(librarian, parsed.fineId)`.
    4. Revalidate `/[locale]/loans` and `/[locale]/admin`, and return `{ ok: true, data }`.
    5. Catch `DomainError` and return `{ ok: false, error: err.code }`.
- **`src/actions/loan.queries.ts` & `src/actions/fine.queries.ts` (`import "server-only"`)**:
  - `getActiveLoansForLibrarianQuery()`: calls `requireLibrarian()` → `loanService.listAllActiveLoans(librarian)`.
  - `getUnpaidFinesForLibrarianQuery()`: calls `requireLibrarian()` → `fineService.listUnpaidFines(librarian)`.

### Architectural & Database Rules to Enforce

- Only a `LIBRARIAN` can record a book return or mark a fine as paid; `MEMBER` callers are rejected at both the Actions layer (`requireLibrarian`) and Service layer (`FORBIDDEN`) (P003, P008-Q1, P010-Q1).
- Closing a loan (`returned_at`, `returned_by_id`) and inserting a late fine (`fines`) always execute in a single `withTransaction` call so a late return never succeeds without creating its fine (`database.md`).
- Returning on or before `due_date` (in `Africa/Cairo` calendar days) creates **no** row in `fines` (`CHECK (days_late > 0)` in `database.md`, P009).
- All fine amounts are whole integer EGP (`daysLate * 5`), never floats (P009, T002).

## Acceptance Criteria

- [x] A `LIBRARIAN` recording an on-time return (`returnDate <= dueDate` in `Africa/Cairo`) sets `returned_at` and `returned_by_id`, creates no `fines` row, increments the book's `availableCopies` by 1, and reduces the member's active loan count by 1 (P005, P006, P008, P009).
- [x] A `LIBRARIAN` recording a late return `N` calendar days past `due_date` (in `Africa/Cairo`) atomically closes the loan and creates a `fines` row with `days_late = N`, `daily_rate_egp = 5`, `amount_egp = N * 5`, and `paid_at = null` (P008, P009).
- [x] Attempting to return an already-returned loan fails with `LOAN_ALREADY_RETURNED` (P008).
- [x] A `LIBRARIAN` marking an unpaid fine as paid sets `paid_at` and `received_by_id`, reduces the member's outstanding fines accordingly, and unblocks the member from borrowing once all unpaid fines are settled (P010).
- [x] Attempting to settle an already-paid fine fails with `FINE_ALREADY_PAID` (P010).
- [x] A `MEMBER` attempting to call `recordReturnAction` or `markFinePaidAction` is rejected with `FORBIDDEN` (P003, P008-Q1, P010-Q1).

## Open Questions

### T007-Q1 — Should book returns and fine settlement be bundled into T006 or split into a dedicated task?

- **A.** Split into a dedicated task T007 (Returns & Fine Settlement Backend) depending on T006 **(Recommended)**
- **B.** Bundle borrowing, returns, and fine settlement into a single task

**Recommendation:** A. Borrowing (member-initiated Copy allocation + 5 eligibility checks) and Return/Fine Settlement (librarian-initiated loan closure + fine creation/payment) are distinct business workflows with different actors and transactions.

**Answer:** A — Split into `T006` (Borrowing & Eligibility Backend) and `T007` (Returns & Fine Settlement Backend).

### T007-Q2 — Which architecture layers are included in this backend-only task?

- **A.** Layers 2, 3 & 4 (`src/repositories/`, `src/schemas/`, `src/services/`, `src/actions/`) without Layer 1 UI **(Recommended)**
- **B.** Layers 3 & 4 only (`src/services/`, `src/repositories/`)

**Recommendation:** A. Completing Layer 2 (`loan.actions.ts`, `fine.actions.ts`, `loan.queries.ts`, `fine.queries.ts`) ensures role checks (`requireLibrarian`), Zod validation, and path revalidation are ready for the UI tasks.

**Answer:** A — Layers 2, 3 & 4 without Layer 1 UI.
