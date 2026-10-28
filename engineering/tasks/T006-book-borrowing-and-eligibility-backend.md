# T006 — Book Borrowing, Eligibility, and Member Loans Backend

| Field | Value |
| --- | --- |
| ID | T006 |
| Status | Done |
| Area | Borrowing (Backend — Layers 2, 3 & 4 without UI) |
| Depends on | [T001](T001-project-scaffolding-and-core-architecture.md), [T002](T002-database-schema-and-prisma-setup.md), [T004](T004-authentication-and-role-access.md), [T005](T005-catalog-browsing-and-book-availability.md) |
| PRDs | [P003](../../prds/P003-librarian-role.md), [P005](../../prds/P005-book-availability.md), [P006](../../prds/P006-max-concurrent-loans.md), [P007](../../prds/P007-loan-period.md), [P009](../../prds/P009-late-fine.md), [P010](../../prds/P010-fine-settlement.md), [P011](../../prds/P011-due-date-reminders.md) |
| TDRs | [T002](../../tdrs/T002-postgresql-database.md), [T003](../../tdrs/T003-server-actions-for-mutations.md), [T004](../../tdrs/T004-prisma-orm.md), [T005](../../tdrs/T005-zod-validation.md), [T006](../../tdrs/T006-layered-architecture.md) |
| Open questions | 0 of 3 |

## What

Implement the complete backend (Layer 4 Repositories, Shared Zod Schemas, Layer 3 Service, and Layer 2 Server Actions & Queries—without Layer 1 UI) for member borrow eligibility evaluation, atomic book borrowing with a 14-day `Africa/Cairo` due date, and member loan queries with live due-soon/overdue status and running late fines.

## Why

Borrowing is the core transaction of Mini Library and must enforce strict invariants under concurrent requests: a member can hold at most 3 active loans (P006), cannot borrow a second copy of the same book (P006-Q1), cannot borrow while holding any overdue loan (P006-Q2) or any unpaid fine (P010-Q2), and can only borrow when a non-withdrawn physical copy is available (P005). Implementing these rules as a pure, transaction-safe backend across Layers 2–4 ensures race conditions (such as two tabs by the same member or two members taking the last copy simultaneously) are handled deterministically before wiring any UI components.

## How

### 1. Layer 4 — Copy, Loan & Fine Repositories (`src/repositories/`) (T004, T006)

- **`src/repositories/user.repository.ts`** (extend from T004):
  - `lockMemberForUpdate(memberId: string, tx: DbClient)`: executes `SELECT id FROM users WHERE id = $1 FOR UPDATE` via parameterized `$queryRaw` to serialize concurrent borrow attempts by the same member ([`../database.md`](../database.md)).
- **`src/repositories/copy.repository.ts`** (extend from T005):
  - `findFirstAvailableCopy(bookId: string, tx?: DbClient)`: finds one physical copy for `bookId` where `withdrawnAt IS NULL` and no loan exists with `returnedAt IS NULL`, ordered deterministically (`createdAt ASC, id ASC`) (P005).
- **`src/repositories/loan.repository.ts`**:
  - `countActiveLoansByMember(memberId: string, tx?: DbClient)`: counts rows in `loans` where `memberId` matches and `returnedAt IS NULL` (P006).
  - `hasOverdueLoanByMember(memberId: string, cairoToday: Date, tx?: DbClient)`: checks if the member has any active loan (`returnedAt IS NULL`) where `dueDate < cairoToday` (P006-Q2, P007).
  - `hasActiveLoanForBook(memberId: string, bookId: string, tx?: DbClient)`: checks if the member already has an active loan (`returnedAt IS NULL`) for `bookId` (P006-Q1).
  - `createLoan(data: { memberId: string; bookId: string; copyId: string; borrowedAt: Date; dueDate: Date }, tx?: DbClient)`: inserts a new active loan row and maps PostgreSQL unique constraint violations on `loans_one_active_per_copy_idx` or `loans_one_active_per_book_member_idx` into typed repository/domain outcomes (P005, P006-Q1).
  - `findLoansByMember(memberId: string, tx?: DbClient)`: returns the member's active and past loans joined with book metadata (`id`, `title`, `author`, `coverImageUrl`), copy `barcode`, and any settled/unpaid fine record (P007, P009, P010, P011).
- **`src/repositories/fine.repository.ts`**:
  - `hasUnpaidFinesByMember(memberId: string, tx?: DbClient)`: checks if any row in `fines` joined to `loans.memberId = memberId` has `paidAt IS NULL` (P010-Q2).
  - `sumUnpaidFinesByMember(memberId: string, tx?: DbClient)`: returns total unpaid fine amount in whole EGP for the member (P010).

### 2. Shared Schemas (`src/schemas/loan.schema.ts`) (T005)

- `borrowBookSchema`: validates `{ bookId: z.string().uuid() }`.
- Export inferred type `BorrowBookInput = z.infer<typeof borrowBookSchema>`.

### 3. Layer 3 — Loan Service (`src/services/loan.service.ts`) (T006)

- Keep `loan.service.ts` pure TypeScript with zero imports from `next/*` or `@prisma/client` ([`../architecture.md`](../architecture.md)):
- **`getBorrowEligibility(user: SessionUser, bookId: string)`**:
  - Verify `user.role === "MEMBER"`; if not, return `{ canBorrow: false, reason: "FORBIDDEN" }` (P003, T006-Q3).
  - Check book existence (`BOOK_NOT_FOUND`) and evaluate blocking rules in deterministic order:
    1. Member already holds an active loan for this book → `ALREADY_BORROWED_BOOK` (P006-Q1).
    2. Member has any overdue active loan (`dueDate < getCairoToday()`) → `HAS_OVERDUE_LOANS` (P006-Q2).
    3. Member has any unpaid fine (`paidAt IS NULL`) → `HAS_UNPAID_FINES` (P010-Q2).
    4. Member has `>= 3` active loans → `LOAN_LIMIT_REACHED` (P006).
    5. Book has `0` available copies → `BOOK_UNAVAILABLE` (P005).
  - If all checks pass, return `{ canBorrow: true, reason: null, dueDatePreview: calculateDueDate(new Date()) }` (P007).
- **`borrowBook(user: SessionUser, bookId: string)`**:
  - Assert `user.role === "MEMBER"`, else throw `DomainError("FORBIDDEN")` (P003, T006-Q3).
  - Run inside `withTransaction(async (tx) => { ... })` ([`../database.md`](../database.md), [`../architecture.md`](../architecture.md)):
    1. Lock the member row (`userRepository.lockMemberForUpdate(user.id, tx)`) so two concurrent borrows by the same member are serialized (P006).
    2. Verify book exists (`BOOK_NOT_FOUND`).
    3. Check `hasActiveLoanForBook` → throw `DomainError("ALREADY_BORROWED_BOOK")` (P006-Q1).
    4. Check `hasOverdueLoanByMember` using `getCairoToday()` → throw `DomainError("HAS_OVERDUE_LOANS")` (P006-Q2).
    5. Check `hasUnpaidFinesByMember` → throw `DomainError("HAS_UNPAID_FINES")` (P010-Q2).
    6. Check `countActiveLoansByMember < 3` → if `>= 3`, throw `DomainError("LOAN_LIMIT_REACHED")` (P006).
    7. Pick an available non-withdrawn copy via `copyRepository.findFirstAvailableCopy(bookId, tx)` → if none, throw `DomainError("BOOK_UNAVAILABLE")` (P005).
    8. Compute `borrowedAt = new Date()` and `dueDate = calculateDueDate(borrowedAt)` (`today in Africa/Cairo + 14 calendar days`, P007).
    9. Call `loanRepository.createLoan(...)`. If a concurrent borrow by another member triggers the partial unique index `loans_one_active_per_copy_idx`, catch and retry with another available copy or translate to `DomainError("BOOK_UNAVAILABLE")` (P005, `database.md`).
- **`getMemberLoansSummary(user: SessionUser)`**:
  - Fetch member loans and unpaid fines total.
  - For each active loan, compute live derived state in `Africa/Cairo` time (`src/lib/dates.ts`):
    - `daysRemaining` and `daysLate` (P007, P009).
    - `dueStatus`: `"ON_TIME"` (`> 2` days left), `"DUE_SOON"` (`0..2` days left, P011), or `"OVERDUE"` (`daysLate > 0`, P006-Q2, P011).
    - `runningFineEgp`: `calculateFineEgp(daysLate)` (`daysLate * 5` EGP while still unreturned, P009).

### 4. Layer 2 — Loan Server Actions & Queries (`src/actions/loan.actions.ts`, `src/actions/loan.queries.ts`) (T003, T005, T006)

- **`src/actions/loan.actions.ts` (`"use server"`)**:
  - `borrowBookAction(input)`:
    1. Authenticate user with `requireUser()` (P002).
    2. Validate input with `borrowBookSchema` (T005).
    3. Call `loanService.borrowBook(user, parsed.bookId)`.
    4. Revalidate `/[locale]/books`, `/[locale]/books/[bookId]`, and `/[locale]/loans`, and return `{ ok: true, data: loan }`.
    5. Catch `DomainError` and return `{ ok: false, error: err.code }` without leaking unexpected exceptions (`architecture.md`).
- **`src/actions/loan.queries.ts` (`import "server-only"`)**:
  - `getBorrowEligibilityQuery(bookId: string)`: authenticates via `requireUser()`, validates `bookId` with `borrowBookSchema`, and delegates to `loanService.getBorrowEligibility`.
  - `getMyLoansQuery()`: authenticates via `requireUser()` and delegates to `loanService.getMemberLoansSummary`.

### Architectural & Database Rules to Enforce

- No UI components or pages (`src/app/`, `src/components/`) are modified or created in this task (T006-Q2).
- `src/services/loan.service.ts` must not import Prisma or Next.js APIs (`revalidatePath`, `cookies`, `redirect`) (T006).
- All 5 borrow eligibility checks (duplicate book, overdue loans, unpaid fines, 3-book limit, available copy) are enforced inside the database transaction after acquiring the `FOR UPDATE` row lock on `users` (`database.md`).
- Due dates and overdue checks always use `Africa/Cairo` calendar days (`src/lib/dates.ts`), never server-local time (P007, P009, T002).

## Acceptance Criteria

- [x] A `MEMBER` with fewer than 3 active loans, no overdue loans, no unpaid fines, and no active loan for the book can borrow an available copy, creating a `loans` row with `due_date = borrow_date (Africa/Cairo) + 14 days` (P005, P006, P007).
- [x] Borrowing fails with `LOAN_LIMIT_REACHED` when the member already has 3 active loans, including when two borrow requests are sent concurrently by the same member (serialized via `FOR UPDATE` lock) (P006, `database.md`).
- [x] Borrowing fails with `ALREADY_BORROWED_BOOK` if the member already holds an active loan for that book (P006-Q1).
- [x] Borrowing fails with `HAS_OVERDUE_LOANS` if the member has any active loan with `due_date < today (Africa/Cairo)`, even with fewer than 3 active loans (P006-Q2).
- [x] Borrowing fails with `HAS_UNPAID_FINES` if the member has any unpaid fine (`paid_at IS NULL`) of any amount (P010-Q2).
- [x] Borrowing fails with `BOOK_UNAVAILABLE` when `availableCopies === 0` or when two members race for the last available copy (one succeeds, one receives `BOOK_UNAVAILABLE`) (P005).
- [x] A `LIBRARIAN` attempting to call `borrowBook` receives `FORBIDDEN` (P003, T006-Q3).
- [x] `getMyLoansQuery` computes `DUE_SOON` (due within 2 days, P011), `OVERDUE` (`daysLate > 0`), and `runningFineEgp = daysLate * 5` (P009) accurately in `Africa/Cairo` time.

## Open Questions

### T006-Q1 — What business scope should this task cover under "book loaning business logic"?

- **A.** Borrowing & borrow eligibility only in T006 (P005, P006, P007, P010-Q2) **(Recommended)**
- **B.** Borrowing + member loan/due-status read queries in T006 (P005–P007, P010-Q2, P011)
- **C.** Split full loan lifecycle into separate tasks: T006 (Borrowing) + T007 (Returns & Fines)

**Recommendation:** Option A or C keeps each task focused on a single cohesive problem per the task planning rules.

**Answer:** C — Split full loan lifecycle into separate tasks: `T006` (Borrowing, eligibility & member loan status) and `T007` (Returns & fine settlement).

### T006-Q2 — Which architecture layers should be included in "backend without UI"?

- **A.** Layers 2, 3 & 4: Repositories + Schemas + Services + Server Actions/Queries (Everything except Layer 1 UI) **(Recommended)**
- **B.** Layers 3 & 4 only: Repositories + Schemas + Services (Defer `src/actions/` to the UI task)

**Recommendation:** A. Including Layer 2 (`src/actions/`) provides the complete server boundary (authentication, Zod input validation, service invocation, and cache revalidation) so Layer 1 UI tasks only need to wire components to existing actions and queries.

**Answer:** A — Layers 2, 3 & 4 (everything except Layer 1 Presentation).

### T006-Q3 — Should borrowing be restricted strictly to users with the `MEMBER` role, or can `LIBRARIAN` accounts also borrow books?

- **A.** `MEMBER` role only (reject `LIBRARIAN` borrow attempts with `FORBIDDEN` per P003/P006) **(Recommended)**
- **B.** Any authenticated user (both `MEMBER` and `LIBRARIAN` can borrow)

**Recommendation:** A. All PRDs (P001, P003, P005–P010) separate `Member` (borrows books) from `Librarian` (manages catalog, records returns, collects fines).

**Answer:** A — `MEMBER` role only.
