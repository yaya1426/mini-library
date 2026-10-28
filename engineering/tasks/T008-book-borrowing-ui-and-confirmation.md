# T008 — Book Borrowing UI and Confirmation Flow

| Field | Value |
| --- | --- |
| ID | T008 |
| Status | Done |
| Area | Borrowing (Presentation — Layer 1 UI) |
| Depends on | [T003](T003-i18n-and-design-system-foundation.md), [T005](T005-catalog-browsing-and-book-availability.md), [T006](T006-book-borrowing-and-eligibility-backend.md) |
| PRDs | [P003](../../prds/P003-librarian-role.md), [P005](../../prds/P005-book-availability.md), [P006](../../prds/P006-max-concurrent-loans.md), [P007](../../prds/P007-loan-period.md), [P010](../../prds/P010-fine-settlement.md), [P012](../../prds/P012-visual-identity.md), [P013](../../prds/P013-ui-language.md) |
| TDRs | [T001](../../tdrs/T001-nextjs-16-framework.md), [T003](../../tdrs/T003-server-actions-for-mutations.md), [T006](../../tdrs/T006-layered-architecture.md), [T007](../../tdrs/T007-tailwind-css-v4.md), [T008](../../tdrs/T008-shadcn-ui-components.md), [T009](../../tdrs/T009-neo-brutalist-design-system.md), [T010](../../tdrs/T010-next-intl-i18n.md) |
| Open questions | 0 of 0 |

## What

Wire the book details page (`/[locale]/books/[bookId]`) and `BorrowPanel` component to the borrowing backend (`getBorrowEligibilityQuery` and `borrowBookAction` from `T006`), adding the interactive borrow confirmation `Dialog` with the 14-day `Africa/Cairo` due date preview (P007) and displaying inverted neo-brutalist `Alert` banners for every borrow-blocking condition (P003, P005, P006, P010).

## Why

Task `T005` built the catalog and book details UI with a static `BorrowPanel` placeholder, and `T006` implemented the transaction-safe borrowing and eligibility backend across Layers 2–4 without UI. Without wiring Layer 1 to `getBorrowEligibilityQuery` and `borrowBookAction`, members cannot actually borrow books from the book details page or see why borrowing is blocked (already holding 3 books, holding an overdue book, having an unpaid fine, already borrowing the same title, or no available copies).

## How

### 1. Layer 1 — Book Details Page Eligibility Integration (`src/app/[locale]/books/[bookId]/page.tsx`, `src/components/book-details.tsx`)

- In `src/app/[locale]/books/[bookId]/page.tsx`:
  - Fetch both `getBookDetailsQuery(bookId)` and `getBorrowEligibilityQuery(bookId)` in parallel on the server (`T003`, `T006`).
  - Pass the `eligibility` result (`{ canBorrow: true, reason: null, dueDatePreview }` or `{ canBorrow: false, reason }`) through `BookDetails` into `BorrowPanel`.

### 2. Layer 1 — Interactive `BorrowPanel` & Confirmation `Dialog` (`src/components/borrow-panel.tsx`, `messages/`)

- Convert `src/components/borrow-panel.tsx` into a Client Component (`"use client"`) per [`../design-system/components.md`](../design-system/components.md) and [`../design-system/usage.md`](../design-system/usage.md):
  - **When `canBorrow === false`:**
    - Render an inverted `Alert` (`variant="destructive"`, `bg-black text-white border-3 border-black`) with an `AlertTriangle` icon and the localized message for `reason` (`errors.<REASON>`: `BOOK_UNAVAILABLE`, `LOAN_LIMIT_REACHED`, `ALREADY_BORROWED_BOOK`, `HAS_OVERDUE_LOANS`, `HAS_UNPAID_FINES`, `FORBIDDEN`) (P003, P005, P006, P010, P012, P013).
  - **When `canBorrow === true`:**
    - Render the expected 14-day due date (`dueDatePreview` formatted via `formatShortDate` in `font-mono` with Western digits, P007, P013) and the primary `lg` **Borrow** `Button` (`bg-black text-white`).
    - Clicking **Borrow** opens a confirmation `Dialog` (`border-4 shadow-lg`, title bar with `border-b-3`, `components.md`) displaying:
      - Book title (`<bdi>`) and 14-day loan period notice.
      - Exact due date in `Africa/Cairo` (`formatShortDate(dueDatePreview, locale)` in `font-mono`).
      - **Cancel** (`variant="secondary"`) and **Confirm** (`variant="default"`) actions.
    - Submitting confirmation calls `borrowBookAction({ bookId })` inside `useTransition`:
      - While pending, disable buttons and show `Loader2` spinner + localized `common.loading` (`usage.md`).
      - On `{ ok: true, data: loan }`: close the dialog and display a confirmation banner/alert with the confirmed due date and a direct link to `/[locale]/loans` (`My Loans`), while Next.js revalidates the page's available copy count and eligibility state.
      - On `{ ok: false, error }`: display an inverted `Alert` inside the dialog / panel translated via `tErrors(error)` (handling race conditions like `BOOK_UNAVAILABLE` or `LOAN_LIMIT_REACHED` gracefully).
- Add any required dialog/success translation keys to **both** `messages/ar.json` and `messages/en.json` with 1-to-1 key parity (T010).

### Architectural & Database Rules to Enforce

- Presentation components (`page.tsx`, `BookDetails`, `BorrowPanel`) call only Layer 2 (`src/actions/book.queries.ts`, `src/actions/loan.queries.ts`, `src/actions/loan.actions.ts`), never Layer 3 services or Layer 4 repositories directly (T006).
- All blocked reasons and action errors are rendered from `DomainErrorCode` via `next-intl` (`errors.<CODE>`), never hardcoded strings (T010, P013).
- Follow neo-brutalist monochrome rules: inverted `Alert` (`bg-black text-white`) for blocked/error states, `font-mono` with Western digits (`0–9`) for due dates, and logical CSS utilities for RTL/LTR parity (P012, P013, T009).

## Acceptance Criteria

- [x] An eligible `MEMBER` viewing `/[locale]/books/[bookId]` sees the **Borrow** button and 14-day due date preview, can confirm in the `Dialog`, and borrowing decrements the displayed available copy count by 1 (P005, P007).
- [x] After borrowing a book, revisiting `/[locale]/books/[bookId]` shows the inverted `Alert` with the localized `ALREADY_BORROWED_BOOK` message instead of the Borrow button (P006-Q1).
- [x] A member with 3 active loans, an overdue loan, or an unpaid fine sees the corresponding localized inverted `Alert` (`LOAN_LIMIT_REACHED`, `HAS_OVERDUE_LOANS`, `HAS_UNPAID_FINES`) and cannot borrow (P006, P006-Q2, P010-Q2).
- [x] Viewing a book with `0` available copies shows the inverted `BOOK_UNAVAILABLE` alert and no Borrow button (P005, P012).
- [x] If a race condition occurs during confirmation (e.g., last copy taken), the UI displays the localized error returned by `borrowBookAction` without crashing (P005, T003).
- [x] Both `/ar/books/[bookId]` (RTL) and `/en/books/[bookId]` (LTR) render with 1-to-1 translation parity and Western digits (`0–9`) (P013, T010).

## Open Questions

_None — all requirements are specified in P005, P006, P007, P010, P012, P013, and `engineering/design-system/components.md`._
