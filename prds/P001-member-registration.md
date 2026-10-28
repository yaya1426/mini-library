# P001 — Member Registration

| Field | Value |
| --- | --- |
| ID | P001 |
| Status | Accepted |
| Area | Auth |
| Created | 2026-10-20 |
| Related | P002 |

## Context

Only members can use the library, so visitors need a way to create an account.

## Decision

A visitor can create a member account with their email and a password.

## Rules

- Email must be unique and in a valid format.
- Password is at least 8 characters and is stored only as a secure hash.
- Every new account gets the **Member** role.
- Required fields: full name, email, password (P001-Q1).
- No email verification in v1; the member is logged in right after sign up (P001-Q2).

## Acceptance criteria

- [ ] A visitor can sign up with a new email.
- [ ] Signing up with an already-used email fails with a clear message.
- [ ] Passwords are never stored in plain text.

## Open questions

### P001-Q1 — Which fields are required at sign up?

- **A.** Full name, email, password **(Recommended)**
- **B.** A + phone number
- **C.** B + national ID

**Recommendation:** A. It is the minimum we need to identify a member and contact them;
more fields slow sign up and add personal data we must protect.

**Answer:** A — decided by product owner on 2026-10-20.

### P001-Q2 — Must the email be verified before the member can borrow?

- **A.** No verification in v1; the member is logged in right after sign up **(Recommended)**
- **B.** Yes, the member must click a verification link first

**Recommendation:** A. Verification needs an email provider and adds friction; we can add
it later without changing other decisions.

**Answer:** A — decided by product owner on 2026-10-20.
