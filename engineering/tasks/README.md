# Mini Library — Engineering Tasks Index

This file is the **single index of all engineering tasks** in the Mini Library project.
Agents must read this file first before planning or implementing any task to check existing `Txxx` tasks, avoid duplicate planning, and understand dependencies.

Every task traces directly to [`../architecture.md`](../architecture.md), [`../database.md`](../database.md), [`../../prds`](../../prds/README.md), [`../../tdrs`](../../tdrs/README.md), and [`../design-system`](../design-system/README.md).

## Task Rules & Numbering Scheme

- Every task solves **one problem only** in its own file under `engineering/tasks/`.
- IDs are `T` + 3 digits in sequence: `T001`, `T002`, … `T999` (never reused or renumbered).
- File name: `T###-short-kebab-title.md` (e.g. `T001-project-scaffolding-and-core-architecture.md`).
- Every task starts from [`_template.md`](_template.md) and includes **What**, **Why**, **How**, **Acceptance Criteria**, and **Open Questions** (`T###-Q#`) with zero assumptions.

## Statuses

| Status | Meaning |
| --- | --- |
| Todo | Ready to be picked up once its dependencies are complete. |
| In Progress | Currently being implemented. |
| Done | All deliverables and acceptance criteria are verified. |
| Blocked | Waiting on an external dependency or unanswered open question (`T###-Q#`). |

## Tasks Index

| ID | One-line description | Depends on | Status | Open questions |
| --- | --- | --- | --- | --- |
| [T001](T001-project-scaffolding-and-core-architecture.md) | Scaffold the Next.js 16 app, establish the 4-layer folder structure, validate env vars with Zod, and implement shared `DomainError` and `Africa/Cairo` date utilities. | — | Done | 0 of 0 |
| [T002](T002-database-schema-and-prisma-setup.md) | Set up Prisma ORM with PostgreSQL, create all 5 tables with custom SQL integrity constraints and trigram indexes, provide `withTransaction`, and seed initial librarian and catalog data. | T001 | Done | 0 of 0 |
| [T003](T003-i18n-and-design-system-foundation.md) | Configure `next-intl` bilingual (`ar` RTL / `en` LTR) routing and translations, neo-brutalist monochrome Tailwind v4 tokens, restyled `shadcn/ui` primitives, and shared layout components. | T001 | Done | 0 of 0 |
| [T004](T004-authentication-and-role-access.md) | Implement member registration, login, logout, session cookies, protected route redirects, and `MEMBER` / `LIBRARIAN` role guards across all 4 architecture layers. | T001, T002, T003 | Done | 0 of 0 |
| [T005](T005-catalog-browsing-and-book-availability.md) | Build the authenticated catalog grid, partial-match title/author search, and book details page with live copy availability derived from non-withdrawn copies and active loans. | T002, T003, T004 | Done | 0 of 0 |
| [T006](T006-book-borrowing-and-eligibility-backend.md) | Implement backend repositories, Zod schemas, service rules, and Server Actions/Queries (no UI) for member borrow eligibility, atomic 14-day book borrowing, and member loan status with running fines. | T001, T002, T004, T005 | Done | 0 of 3 |
| [T007](T007-book-return-and-fine-settlement-backend.md) | Implement backend repositories, Zod schemas, services, and librarian Server Actions/Queries (no UI) for recording book returns, creating 5 EGP/day late fines, and settling unpaid fines. | T001, T002, T004, T006 | Done | 0 of 2 |
| [T008](T008-book-borrowing-ui-and-confirmation.md) | Wire `BorrowPanel` on `/[locale]/books/[bookId]` to `getBorrowEligibilityQuery` and `borrowBookAction` with a 14-day due-date confirmation `Dialog` and inverted blocked-reason alerts. | T003, T005, T006 | Done | 0 of 0 |
| [T009](T009-member-loans-reminders-and-fines-ui.md) | Build the `/[locale]/loans` member dashboard (`DueSoonBanner`, `LoanSummary`, `LoanList`, `DueStatus`, `FineAmount`, `FineList`) showing active loans, due-soon/overdue reminders, and fines. | T003, T006, T008 | Todo | 0 of 0 |
| [T010](T010-librarian-returns-and-fine-settlement-ui.md) | Build the `/[locale]/admin` librarian UI for active loans (`ActiveLoansTable`, `RecordReturnDialog`) and unpaid fines (`UnpaidFinesTable`, `MarkFinePaidDialog`). | T003, T004, T007 | Todo | 0 of 0 |
| [T011](T011-librarian-catalog-and-copy-management.md) | Implement full-stack librarian catalog and physical copy management (`BookForm`, `CopyList`, auto/custom copy barcodes, copy withdrawal via `withdrawn_at`, and safe book removal). | T002, T004, T005, T010 | Todo | 0 of 2 |
| [T012](T012-librarian-member-directory-and-password-reset.md) | Implement full-stack librarian member directory (`MembersTable`) and manual member password reset (`ResetPasswordDialog`). | T004, T006, T007, T010 | Todo | 0 of 0 |

Next free number: **T013**

## Dependency Flow

```
T001  Project scaffolding & core architecture (Done)
 ├──► T002  Database schema, Prisma ORM, constraints & seed (Done)
 └──► T003  Internationalization (ar/en) & Neo-brutalist design system (Done)
        │
        ├── (T002 + T003) ──► T004  Authentication, sessions & roles (Done)
                                │
                                └──► T005  Catalog browsing, search & book availability (Done)
                                       │
                                       └──► T006  Book borrowing & eligibility backend (Done)
                                              │
                                              ├──► T007  Book returns & fine settlement backend (Done)
                                              │      │
                                              │      └──► T010  Librarian returns & fine settlement UI
                                              │             ├──► T011  Librarian catalog & copy management
                                              │             └──► T012  Librarian member directory & password reset
                                              │
                                              └──► T008  Book borrowing UI & confirmation flow
                                                     │
                                                     └──► T009  Member loans, reminders & fines dashboard UI
```
