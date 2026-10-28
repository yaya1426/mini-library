# T004 — Authentication, Session Management, and Role-Based Access

| Field | Value |
| --- | --- |
| ID | T004 |
| Status | Done |
| Area | Auth & Roles (Full-stack across all 4 layers) |
| Depends on | [T001](T001-project-scaffolding-and-core-architecture.md), [T002](T002-database-schema-and-prisma-setup.md), [T003](T003-i18n-and-design-system-foundation.md) |
| PRDs | [P001](../../prds/P001-member-registration.md), [P002](../../prds/P002-login-and-protected-access.md), [P003](../../prds/P003-librarian-role.md), [P013](../../prds/P013-ui-language.md) |
| TDRs | [T003](../../tdrs/T003-server-actions-for-mutations.md), [T005](../../tdrs/T005-zod-validation.md), [T006](../../tdrs/T006-layered-architecture.md), [T008](../../tdrs/T008-shadcn-ui-components.md), [T010](../../tdrs/T010-next-intl-i18n.md) |
| Open questions | 0 of 0 |

## What

Deliver end-to-end member registration (P001), login, logout, protected route enforcement with return-to-page redirect (P002), and `MEMBER` / `LIBRARIAN` role guards (P003) across all four architecture layers.

## Why

The Mini Library catalog, borrowing workflows, and librarian operations are strictly protected behind authentication (P002): visitors cannot browse or borrow until they register or log in, and staff actions must be restricted to `LIBRARIAN` accounts (P003). Implementing authentication and session helpers (`requireUser`, `requireLibrarian`) now unblocks all authenticated queries and mutations in the catalog (T005), borrowing (T006), member dashboard (T007), and librarian panel (T008).

## How

### 1. Layer 4 — User Repository (`src/repositories/user.repository.ts`)

- Implement Prisma queries for the `users` table (`engineering/database.md`):
  - `findUserByEmail(email: string, tx?: DbClient)` (case-insensitive via `citext`).
  - `findUserById(id: string, tx?: DbClient)`.
  - `createMember({ fullName, email, passwordHash }, tx?: DbClient)` — always sets `role: "MEMBER"` (P001, P003).
  - `updateUserPassword(userId: string, passwordHash: string, tx?: DbClient)` — supports manual password reset by a librarian (P002-Q1, P003).
- Return plain domain `User` objects (`id`, `fullName`, `email`, `role`, `createdAt`) so Prisma types do not leak upward (`architecture.md`).

### 2. Shared Schemas & Utilities — Session, Password Hashing & Auth Schemas (`src/lib/`, `src/schemas/`)

- **Password hashing (`src/lib/password.ts`):**
  - Hash passwords with a strong one-way algorithm (e.g. Node `crypto.scrypt` / `argon2` / `bcryptjs`) and verify hashes in constant time (P001).
- **Session management (`src/lib/session.ts`):**
  - Store a signed/encrypted `httpOnly`, `sameSite: "lax"`, `secure` (in production) session cookie upon login or sign-up.
  - Provide server-only helpers for the Actions layer:
    - `getSessionUser()`: returns the authenticated user or `null`.
    - `requireUser()`: returns the authenticated user or throws `DomainError("UNAUTHORIZED")`.
    - `requireLibrarian()`: verifies `user.role === "LIBRARIAN"` or throws `DomainError("FORBIDDEN")` (P003).
- **Zod Schemas (`src/schemas/auth.schema.ts`) (T005):**
  - `signUpSchema`: `fullName` (trimmed non-empty string, P001-Q1), `email` (valid email format, normalized/trimmed, P001), `password` (minimum 8 characters, P001).
  - `loginSchema`: `email` (valid email format), `password` (non-empty string).
  - Use message keys for validation errors so the UI translates field errors via `next-intl` (T010).

### 3. Layer 3 — Auth Service (`src/services/auth.service.ts`) (T006)

- `registerMember(input: SignUpInput)`:
  - Check if `email` is already registered; if so, throw `DomainError("EMAIL_ALREADY_IN_USE")` (P001).
  - Hash password and call `userRepository.createMember(...)` with `role: "MEMBER"` (P001, P003).
  - Return the newly created member.
- `authenticateUser(input: LoginInput)`:
  - Look up user by email and verify password hash.
  - On missing user or wrong password, throw `DomainError("INVALID_CREDENTIALS")` without revealing which field was wrong (P002).

### 4. Layer 2 — Auth Server Actions (`src/actions/auth.actions.ts`) (T003)

- `"use server"` mutations:
  - `signUpAction(prevState, formData)`: validate with `signUpSchema` → call `authService.registerMember` → create session immediately (no email verification in v1 per P001-Q2) → redirect to `/[locale]/books`.
  - `loginAction(prevState, formData)`: validate with `loginSchema` → call `authService.authenticateUser` → create session → redirect to validated `callbackUrl` (or `/[locale]/books`) (P002).
  - `logoutAction()`: clear session cookie → redirect to `/[locale]/login` (P002).

### 5. Layer 1 — Auth Screens & Protected Route Handling (`src/app/[locale]/`, `src/components/`)

- Build `SignUpForm` and `LoginForm` using `useActionState` (T008), `FormField`, `Button`, and `Alert` (`components.md`):
  - `src/app/[locale]/(auth)/signup/page.tsx`: full name, email, password, link to login, and visible `LanguageSwitcher` (P001, P013).
  - `src/app/[locale]/(auth)/login/page.tsx`: email, password, generic error alert for `INVALID_CREDENTIALS`, link to sign up, and visible `LanguageSwitcher` (P002, P013).
- Protect authenticated routes (`/books`, `/loans`, `/admin`):
  - Unauthenticated visitors accessing protected pages are redirected to `/[locale]/login?callbackUrl=...` and returned to that page after logging in (P002).
  - Non-librarians accessing `/[locale]/admin/...` are blocked/redirected (P003).

### Architectural & Database Rules to Enforce

- Public sign-up can never assign the `LIBRARIAN` role, even if a `role` field is injected into `FormData` (P003, T003, T005).
- Plain-text passwords are never logged, persisted, or returned from any layer (P001).
- Login failures always return the single `INVALID_CREDENTIALS` code ("Invalid email or password" / localized equivalent) for both unknown email and wrong password (P002).

## Acceptance Criteria

- [x] A visitor can sign up with full name, unique email, and ≥ 8-character password, and is immediately logged in with the `MEMBER` role and redirected to the catalog (P001).
- [x] Signing up with an existing email (regardless of letter case) fails and displays a clear localized message (P001, T010).
- [x] Logging in with wrong email or wrong password shows the same generic "Invalid email or password" message in Arabic or English (P002, P013).
- [x] Visiting a protected URL while logged out redirects to `/[locale]/login` and returns to the original URL after login (P002).
- [x] Logging out destroys the session and blocks access to protected pages (P002).
- [x] `LanguageSwitcher` is visible and functional on both `/login` and `/signup` (P013).

## Open Questions

_None — all authentication, password, and role rules are specified in P001, P002, P003, and `engineering/architecture.md`._
