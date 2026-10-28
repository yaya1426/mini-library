# T012 — Librarian Member Directory and Manual Password Reset

| Field | Value |
| --- | --- |
| ID | T012 |
| Status | Todo |
| Area | Librarian Member Management (Full-stack across all 4 layers) |
| Depends on | [T004](T004-authentication-and-role-access.md), [T006](T006-book-borrowing-and-eligibility-backend.md), [T007](T007-book-return-and-fine-settlement-backend.md), [T010](T010-librarian-returns-and-fine-settlement-ui.md) |
| PRDs | [P001](../../prds/P001-member-registration.md), [P002](../../prds/P002-login-and-protected-access.md), [P003](../../prds/P003-librarian-role.md), [P012](../../prds/P012-visual-identity.md), [P013](../../prds/P013-ui-language.md) |
| TDRs | [T003](../../tdrs/T003-server-actions-for-mutations.md), [T004](../../tdrs/T004-prisma-orm.md), [T005](../../tdrs/T005-zod-validation.md), [T006](../../tdrs/T006-layered-architecture.md), [T008](../../tdrs/T008-shadcn-ui-components.md), [T009](../../tdrs/T009-neo-brutalist-design-system.md), [T010](../../tdrs/T010-next-intl-i18n.md) |
| Open questions | 0 of 0 |

## What

Implement the Librarian Member Directory and Manual Password Reset workflow across all four architecture layers so a librarian can view all members along with their active loans and unpaid fines (P003) and manually reset a member's password via `ResetPasswordDialog` (P002-Q1, P003, [`../design-system/components.md`](../design-system/components.md)).

## Why

PRD `P002-Q1` deferred automated email password resets in v1 in favor of manual password resets by a librarian, and `P003` specifies that a librarian can *"Reset a member's password manually (P002)"* and *"View all members and their loans"*. While `updateUserPassword` was added to `src/repositories/user.repository.ts` in `T004`, the service, Server Action/Query, member directory table, and `ResetPasswordDialog` UI (`components.md`) are not yet built.

## How

### 1. Layer 4 — User Repository Extension (`src/repositories/user.repository.ts`) (T004, T006)

- Add `findAllMembersWithStats(tx?: DbClient)` in `src/repositories/user.repository.ts`:
  - Queries `users` (`WHERE role = 'MEMBER'`, ordered by `createdAt ASC`) with their active loans (`returnedAt IS NULL`, including book title, copy barcode, `dueDate`) and unpaid fines total (`paidAt IS NULL`).
  - Returns plain domain objects (never exposing `passwordHash`).

### 2. Shared Schemas & Domain Error Codes (`src/lib/errors.ts`, `src/schemas/auth.schema.ts`) (T005)

- Extend `DOMAIN_ERROR_CODES` in `src/lib/errors.ts` (and add matching translations in `messages/ar.json` and `messages/en.json`):
  - `USER_NOT_FOUND`.
- In `src/schemas/auth.schema.ts`:
  - `resetMemberPasswordSchema`: validates `{ userId: z.string().trim().uuid(), newPassword: z.string().min(8, AUTH_VALIDATION_KEYS.passwordMin) }` (P001, P002-Q1).
  - Export `ResetMemberPasswordInput = z.infer<typeof resetMemberPasswordSchema>`.

### 3. Layer 3 — Auth / Member Service (`src/services/auth.service.ts`) (T006)

- **`resetMemberPassword(actor: SessionUser, input: ResetMemberPasswordInput)`**:
  - Assert `actor.role === "LIBRARIAN"`, else throw `DomainError("FORBIDDEN")` (P003).
  - Fetch target user via `findUserById(input.userId)` → if not found or `user.role !== "MEMBER"`, throw `DomainError("USER_NOT_FOUND")`.
  - Hash `input.newPassword` with `hashPassword` (`src/lib/password.ts`, P001) and update via `updateUserPassword(input.userId, passwordHash)`.
- **`listMembersForLibrarian(actor: SessionUser)`**:
  - Assert `actor.role === "LIBRARIAN"`, else throw `DomainError("FORBIDDEN")` (P003).
  - Fetch members from `findAllMembersWithStats()` and enrich each member's active loans with `isOverdue` in `Africa/Cairo` time.

### 4. Layer 2 — Librarian Member Actions & Queries (`src/actions/auth.actions.ts`, `src/actions/auth.queries.ts`) (T003, T005, T006)

- **`src/actions/auth.actions.ts` (`"use server"`)**:
  - `resetMemberPasswordAction(input)`:
    1. Authenticate with `requireLibrarian()` (P003).
    2. Validate input with `resetMemberPasswordSchema` (T005).
    3. Call `authService.resetMemberPassword(librarian, parsed.data)`.
    4. Revalidate `/[locale]/admin` and return `{ ok: true, data: { userId: parsed.data.userId } }`.
    5. Catch `DomainError` and return `{ ok: false, error: err.code }`.
- **`src/actions/auth.queries.ts` (`import "server-only"`)**:
  - `getMembersForLibrarianQuery()`: calls `requireLibrarian()` → `authService.listMembersForLibrarian`.

### 5. Layer 1 — Member Directory & `ResetPasswordDialog` UI (`src/components/`, `src/app/[locale]/admin/page.tsx`)

Build the librarian member components per [`../design-system/components.md`](../design-system/components.md):

- **`ResetPasswordDialog` (`src/components/reset-password-dialog.tsx`)**:
  - Client Component (`"use client"`) opening a neo-brutalist `Dialog` for a selected member.
  - Displays the member's full name (`<bdi>`) and email (`dir="ltr"` `font-mono`), a `FormField` for the new temporary password (`minLength={8}`, `dir="ltr"`), field-level Zod validation errors, and submit/cancel buttons.
- **`MembersTable` (`src/components/members-table.tsx`)**:
  - Displays all registered `MEMBER`s in a neo-brutalist `Table`:
    - Columns: Member name (`<bdi>`), Email (`font-mono` `dir="ltr"`), Active loans (`N / 3` + book titles/overdue badges), Unpaid fines (`FineAmount`), Joined date (`formatShortDate`), and **Reset password** action (`ResetPasswordDialog`).
- Add the **Members** tab to `/[locale]/admin` (`src/app/[locale]/admin/page.tsx`) alongside Active Loans, Unpaid Fines, and Books & Copies.
- Add all translation keys in **both** `messages/ar.json` and `messages/en.json` with 1-to-1 parity (T010).

### Architectural & Database Rules to Enforce

- Only a `LIBRARIAN` can list members or reset a member's password (`requireLibrarian` in Layer 2 + `FORBIDDEN` check in Layer 3) (P003).
- New temporary passwords must be at least 8 characters and hashed with `hashPassword` (`crypto.scrypt`) before persistence; plain-text passwords are never stored or logged (P001, P002-Q1).
- `passwordHash` is never returned by `findAllMembersWithStats` or any query (P001, `architecture.md`).

## Acceptance Criteria

- [ ] A `LIBRARIAN` can view all registered members and their active loans and unpaid fine totals in `/[locale]/admin` (P003).
- [ ] A `LIBRARIAN` can reset a member's password via `ResetPasswordDialog` (enforcing ≥ 8 characters), and the member can immediately log in with the new password while the old password stops working (P001, P002, P002-Q1, P003).
- [ ] A `MEMBER` attempting to call `resetMemberPasswordAction` or `getMembersForLibrarianQuery` is rejected with `FORBIDDEN` (P003).
- [ ] Both `/ar/admin` (RTL) and `/en/admin` (LTR) render `MembersTable` and `ResetPasswordDialog` with 1-to-1 translation parity and Western digits (`0–9`) (P013, T010).

## Open Questions

_None — all requirements are specified in P001, P002-Q1, P003, and `engineering/design-system/components.md`._
