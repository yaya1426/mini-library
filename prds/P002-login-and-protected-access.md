# P002 — Login and Protected Access

| Field | Value |
| --- | --- |
| ID | P002 |
| Status | Accepted |
| Area | Auth |
| Created | 2026-10-20 |
| Related | P001, P004 |

## Context

The catalog and borrowing are for members only, so the system must know who the user is.

## Decision

Registered users log in with email and password. The catalog and all borrowing features
require a logged-in user.

## Rules

- Wrong email or password shows one generic error: "Invalid email or password".
- A visitor opening a protected page is sent to log in, then returned to that page.
- A logged-in member can log out, which ends their session.
- No "forgot password" in v1; a librarian resets passwords manually (P002-Q1).

## Acceptance criteria

- [ ] Correct credentials log the user in.
- [ ] Wrong credentials show the generic error without revealing which field was wrong.
- [ ] A visitor cannot reach the catalog without logging in.
- [ ] Logging out ends access to protected pages.

## Open questions

### P002-Q1 — Do we need "forgot password" in v1?

- **A.** No, defer to a later version **(Recommended)**
- **B.** Yes, reset via an emailed link

**Recommendation:** A. Like email verification, it depends on an email provider. A
librarian can reset a password manually until then (see P003).

**Answer:** A — decided by product owner on 2026-10-20.
