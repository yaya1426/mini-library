# T010 — Librarian Returns and Fine Settlement UI

| Field | Value |
| --- | --- |
| ID | T010 |
| Status | Todo |
| Area | Librarian Desk — Returns & Fines (Presentation — Layer 1 UI) |
| Depends on | [T003](T003-i18n-and-design-system-foundation.md), [T004](T004-authentication-and-role-access.md), [T007](T007-book-return-and-fine-settlement-backend.md) |
| PRDs | [P003](../../prds/P003-librarian-role.md), [P005](../../prds/P005-book-availability.md), [P008](../../prds/P008-book-return.md), [P009](../../prds/P009-late-fine.md), [P010](../../prds/P010-fine-settlement.md), [P012](../../prds/P012-visual-identity.md), [P013](../../prds/P013-ui-language.md) |
| TDRs | [T001](../../tdrs/T001-nextjs-16-framework.md), [T003](../../tdrs/T003-server-actions-for-mutations.md), [T006](../../tdrs/T006-layered-architecture.md), [T007](../../tdrs/T007-tailwind-css-v4.md), [T008](../../tdrs/T008-shadcn-ui-components.md), [T009](../../tdrs/T009-neo-brutalist-design-system.md), [T010](../../tdrs/T010-next-intl-i18n.md) |
| Open questions | 0 of 0 |

## What

Build the Librarian Desk UI at `/[locale]/admin` for viewing all active loans across members, recording physical book returns with fine confirmation (`ActiveLoansTable`, `RecordReturnDialog`), and viewing and settling unpaid fines in person (`UnpaidFinesTable`, `MarkFinePaidDialog`), wired to the `T007` backend (`getActiveLoansForLibrarianQuery`, `getUnpaidFinesForLibrarianQuery`, `recordReturnAction`, `markFinePaidAction`).

## Why

Task `T007` implemented the server-side repositories, services, and Server Actions/Queries for book returns and fine settlements without UI. Librarians need a dedicated staff interface (`/[locale]/admin`) to inspect active loans, confirm physical book returns (seeing the resulting 5 EGP/day late fine when a book is returned late per P008 and P009), and mark unpaid fines as paid when cash is collected in person at the desk (P010-Q1).

## How

### 1. Layer 1 — Restyled `shadcn/ui` Tabs Component (`src/components/ui/tabs.tsx`) (T008, T009)

- Add and restyle `src/components/ui/tabs.tsx` per [`../design-system/components.md`](../design-system/components.md):
  - Square corners, `border-3 border-black`, bold labels (`ltr:uppercase ltr:tracking-wider`), and active tab inverted (`data-[state=active]:bg-black data-[state=active]:text-white`).

### 2. Layer 1 — Librarian Returns & Fines Components (`src/components/`)

Implement the librarian components specified in [`../design-system/components.md`](../design-system/components.md):

- **`RecordReturnDialog` (`src/components/record-return-dialog.tsx`)**:
  - Client Component (`"use client"`) triggered from each row in `ActiveLoansTable`.
  - Displays the book title (`<bdi>`), copy barcode (`font-mono` `dir="ltr"`), member name/email, borrow date, and due date.
  - Shows whether the return is on time (`0 EGP` fine) or overdue (`daysLate` days late → `runningFineEgp` EGP fine to be finalized upon return, P008, P009).
  - Submits `recordReturnAction({ loanId })` and displays any `DomainError` (`LOAN_ALREADY_RETURNED`, `LOAN_NOT_FOUND`, `FORBIDDEN`) via `errors.<CODE>`.
- **`ActiveLoansTable` (`src/components/active-loans-table.tsx`)**:
  - Renders all active loans ordered by `dueDate ASC` in a neo-brutalist `Table`:
    - Columns: Member (full name + `dir="ltr"` email), Book (`<bdi>`), Copy barcode (`font-mono`), Borrowed date, Due date & `DueStatus`, Running fine (`FineAmount`), and **Record return** action (`RecordReturnDialog`).
    - Overdue rows are visually highlighted (`components.md`, P011, P012).
  - Shows `EmptyState` when there are no active loans.
- **`MarkFinePaidDialog` (`src/components/mark-fine-paid-dialog.tsx`)**:
  - Client Component (`"use client"`) triggered from each row in `UnpaidFinesTable`.
  - Confirms the exact cash amount received in person (`formatMoneyEgp(fine.amountEgp, locale)` in `font-mono`), member details, book title, and `daysLate × 5 EGP` breakdown (P009, P010-Q1).
  - Submits `markFinePaidAction({ fineId })` and displays any `DomainError` (`FINE_ALREADY_PAID`, `FINE_NOT_FOUND`, `FORBIDDEN`) via `errors.<CODE>`.
- **`UnpaidFinesTable` (`src/components/unpaid-fines-table.tsx`)**:
  - Renders all unpaid fines (`paidAt === null`) in a neo-brutalist `Table`:
    - Columns: Member (name + email), Book (`<bdi>`) & copy barcode, Days late (`font-mono`), Amount (`FineAmount` / inverted `UNPAID` badge), Created date, and **Mark as paid** action (`MarkFinePaidDialog`).
  - Shows `EmptyState` when there are no unpaid fines.

### 3. Layer 1 — Librarian Admin Page (`src/app/[locale]/admin/page.tsx`, `messages/`)

- Update `src/app/[locale]/admin/page.tsx`:
  - Enforce librarian access via `requireLibrarianPageUser` (P003).
  - Fetch `getActiveLoansForLibrarianQuery()` and `getUnpaidFinesForLibrarianQuery()` in parallel.
  - Render `PageHeader` and `Tabs` switching between **Active Loans** (`ActiveLoansTable`, with count badge) and **Unpaid Fines** (`UnpaidFinesTable`, with count badge) (ready to add Catalog and Members tabs in `T011` and `T012`).
- Add all required translation keys to **both** `messages/ar.json` and `messages/en.json` with 1-to-1 parity (T010).

### Architectural & Database Rules to Enforce

- Non-librarians visiting `/[locale]/admin` are redirected away by `requireLibrarianPageUser`, and all underlying actions/queries enforce `requireLibrarian()` (P003).
- Pages and components call only `src/actions/loan.queries.ts`, `src/actions/fine.queries.ts`, `src/actions/loan.actions.ts`, and `src/actions/fine.actions.ts` (T006).
- All money and date values use `font-mono` with Western digits (`0–9`) and `Africa/Cairo` formatting (P009, P013).

## Acceptance Criteria

- [ ] A logged-in `LIBRARIAN` visiting `/[locale]/admin` sees all active loans across members ordered by due date, with overdue loans clearly marked and showing their running fine (P003, P009, P012).
- [ ] Clicking **Record return** opens `RecordReturnDialog`, previews any late fine, and confirming closes the loan and updates the table immediately (P008, P009).
- [ ] Returning an overdue loan creates an unpaid fine that immediately appears in the **Unpaid Fines** tab (`UnpaidFinesTable`) with the exact `daysLate × 5 EGP` amount (P008, P009, P010).
- [ ] Clicking **Mark as paid** opens `MarkFinePaidDialog`, and confirming removes the fine from the unpaid list and unblocks the member from borrowing (P010, P010-Q1).
- [ ] A `MEMBER` cannot access `/[locale]/admin` (redirected to `/[locale]/books`) (P003).
- [ ] Both `/ar/admin` (RTL) and `/en/admin` (LTR) render with 1-to-1 translation parity and Western digits (`0–9`) (P013, T010).

## Open Questions

_None — all requirements are specified in P003, P008, P009, P010, T007, and `engineering/design-system/components.md`._
