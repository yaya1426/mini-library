# T009 — Member Loans, Due-Date Reminders, and Fines Dashboard UI

| Field | Value |
| --- | --- |
| ID | T009 |
| Status | Todo |
| Area | Member Loans & Fines (Presentation — Layer 1 UI) |
| Depends on | [T003](T003-i18n-and-design-system-foundation.md), [T006](T006-book-borrowing-and-eligibility-backend.md), [T008](T008-book-borrowing-ui-and-confirmation.md) |
| PRDs | [P006](../../prds/P006-max-concurrent-loans.md), [P007](../../prds/P007-loan-period.md), [P008](../../prds/P008-book-return.md), [P009](../../prds/P009-late-fine.md), [P010](../../prds/P010-fine-settlement.md), [P011](../../prds/P011-due-date-reminders.md), [P012](../../prds/P012-visual-identity.md), [P013](../../prds/P013-ui-language.md) |
| TDRs | [T001](../../tdrs/T001-nextjs-16-framework.md), [T006](../../tdrs/T006-layered-architecture.md), [T007](../../tdrs/T007-tailwind-css-v4.md), [T008](../../tdrs/T008-shadcn-ui-components.md), [T009](../../tdrs/T009-neo-brutalist-design-system.md), [T010](../../tdrs/T010-next-intl-i18n.md) |
| Open questions | 0 of 0 |

## What

Build the Member Loans & Fines dashboard at `/[locale]/loans` (`src/app/[locale]/loans/page.tsx`) and its neo-brutalist presentation components (`DueSoonBanner`, `LoanSummary`, `LoanList`, `DueStatus`, `FineAmount`, and `FineList`) defined in [`../design-system/components.md`](../design-system/components.md), powered by `getMyLoansQuery()` from `T006`.

## Why

Members need a single place to track how many of their 3 loan slots are in use (P006), see each active loan's borrow date, 14-day due date, and days remaining (P007), receive prominent in-app warnings when a book is due within 2 days or overdue (P011), watch the running 5 EGP/day late fine on overdue unreturned books (P009), and inspect their settled/unpaid fines and total outstanding balance (P010).

## How

### 1. Layer 1 — Member Loans & Fines Components (`src/components/`)

Implement the components specified in [`../design-system/components.md`](../design-system/components.md) and [`../design-system/usage.md`](../design-system/usage.md):

- **`FineAmount` (`src/components/fine-amount.tsx`)**:
  - Renders whole Egyptian Pounds in `font-mono` with Western digits (`25 ج.م` in Arabic, `25 EGP` in English) via `formatMoneyEgp` (P009, P012, P013).
- **`DueStatus` (`src/components/due-status.tsx`)**:
  - Displays the status badge for an active loan using text + icon + visual treatment (never color alone, P012, `usage.md`):
    - `"ON_TIME"` (`> 2` days remaining): `Badge` (`variant="default"`, white with black border) + `Clock` icon + localized `DUE OCT 30` / `الإرجاع 30 أكتوبر` (P007).
    - `"DUE_SOON"` (`0..2` days remaining): `Badge` (`variant="warning"`, `border-dashed`) + `AlertTriangle` icon + localized `DUE IN N DAYS` / `الإرجاع خلال N يوم` (or `DUE TODAY` / `مستحق اليوم` when `daysRemaining === 0`) (P011).
    - `"OVERDUE"` (`daysLate > 0`): `Badge` (`variant="inverted"`, `bg-black text-white`) + `AlertTriangle` icon + localized `OVERDUE · N DAYS · M EGP` / `متأخر · N يوم · M ج.م` showing the running fine (P006-Q2, P009, P011, P012).
- **`DueSoonBanner` (`src/components/due-soon-banner.tsx`)**:
  - Rendered at the top of `/[locale]/loans` when `hasDueSoonOrOverdue` is `true` (P011).
  - Uses `Alert` (`variant="destructive"` when any loan is `OVERDUE`, or `variant="default"` dashed `border-3 border-dashed border-black` when loans are `DUE_SOON`) with `AlertTriangle` icon and localized reminder text (`components.md`).
- **`LoanSummary` (`src/components/loan-summary.tsx`)**:
  - Two-panel summary grid (`Card` with `border-3 border-black shadow-sm`):
    1. **Active loans counter**: Big `text-6xl font-mono font-bold` counter `2 / 3` (`activeLoansCount / maxConcurrentLoans`) with localized label (P006, `components.md`).
    2. **Outstanding fines total**: Big `text-6xl font-mono font-bold` amount formatted via `FineAmount` (`totalUnpaidFinesEgp`). When `totalUnpaidFinesEgp > 0`, the card is **inverted** (`bg-black text-white`) with a notice that unpaid fines block new borrows (P010, P010-Q2, P012, `components.md`).
- **`LoanList` (`src/components/loan-list.tsx`)**:
  - Displays the member's active loans as responsive cards on mobile and a neo-brutalist `Table` on desktop (`components.md`):
    - Book title (wrapped in `<bdi>`, linking to `/[locale]/books/[bookId]`), author (`<bdi>`), copy barcode (`font-mono` `dir="ltr"`), borrow date (`formatShortDate`), due date (`formatShortDate`), `DueStatus` badge, and running fine (`FineAmount` when `runningFineEgp > 0`).
    - Overdue rows/cards are visually highlighted per P011 and P012.
    - Note: Members have **no** "Return" button (only librarians record returns per P008-Q1).
  - When `activeLoans.length === 0`, renders `EmptyState` with a primary link to `/[locale]/books`.
- **`FineList` (`src/components/fine-list.tsx`)**:
  - Displays fines from returned late loans (`pastLoans` with a `fine` record) and past loan history:
    - Shows book title (`<bdi>`), borrowed/returned dates, days late (`font-mono`), fine amount (`FineAmount`), and settlement status `Badge`:
      - Unpaid (`paidAt === null`): `Badge` (`variant="inverted"`) + `Wallet` icon + localized `UNPAID · 25 EGP` / `غير مدفوعة · 25 ج.م` (P010, `usage.md`).
      - Paid (`paidAt !== null`): `Badge` (`variant="default"`) + `Check` icon + localized `PAID` / `مدفوعة` (P010, `usage.md`).

### 2. Layer 1 — My Loans Route (`src/app/[locale]/loans/page.tsx`, `messages/`)

- Update `src/app/[locale]/loans/page.tsx`:
  - Authenticate with `requireAuthenticatedPageUser` and call `getMyLoansQuery()`.
  - Render `PageHeader`, `DueSoonBanner` (when applicable), `LoanSummary`, `LoanList` (active loans), and `FineList` (fines & past loans).
- Ensure all required keys exist in **both** `messages/ar.json` and `messages/en.json` with 1-to-1 parity (T010).

### Architectural & Database Rules to Enforce

- Members never see or trigger a "Return" action on `/[locale]/loans` (P008-Q1).
- All date/countdown/fine values come from `getMyLoansQuery()` (computed in `Africa/Cairo` time) and are formatted with Western digits (`0–9`, `font-mono`) (P007, P009, P013).
- Status differentiation (`ON_TIME`, `DUE_SOON`, `OVERDUE`, `UNPAID`, `PAID`) uses borders (`border-dashed`), inversion (`bg-black text-white`), icons, and labels—never color (P012, T009).

## Acceptance Criteria

- [ ] `/[locale]/loans` displays the `LoanSummary` with the member's `active / 3` counter and total unpaid fines in EGP (inverted when `> 0`) (P006, P010, P012).
- [ ] Active loans due within 2 days show the dashed `DUE_SOON` badge and trigger `DueSoonBanner` at the top of the page (P011).
- [ ] Overdue active loans are highlighted with the inverted `OVERDUE` badge and show their live running fine (`daysLate × 5 EGP`) (P009, P011, P012).
- [ ] Returned loans with fines appear in `FineList` with `UNPAID` (inverted) or `PAID` badges, and paid fines do not count toward the outstanding total (P010).
- [ ] No "Return" button exists for members on `/[locale]/loans` (P008-Q1).
- [ ] Both `/ar/loans` (RTL) and `/en/loans` (LTR) render cleanly with Western digits (`0–9`) and `<bdi>`-wrapped book titles (P013, T010).

## Open Questions

_None — all requirements are specified in P006–P013 and `engineering/design-system/components.md`._
