# P003 — Librarian Role

| Field | Value |
| --- | --- |
| ID | P003 |
| Status | Accepted |
| Area | Roles |
| Created | 2026-10-20 |
| Related | P004, P008, P010 |

## Context

Someone has to add books and copies to the catalog, confirm that a physical book came
back, and record fine payments. Members should not be able to do these things themselves.

## Decision

The system has two roles: **Member** and **Librarian**. Librarians are created by another
librarian (or seeded at setup), never through public sign up.

## Rules

A librarian can:

- Add, edit, and remove books, and set the number of copies.
- Record that a copy was returned (P008).
- Mark a fine as paid (P010).
- Reset a member's password manually (P002).
- View all members and their loans.

## Acceptance criteria

- [ ] Public sign up can only create Members.
- [ ] Only Librarians can manage books, returns, and fine payments.

## Open questions

### P003-Q1 — Is there a librarian role in v1?

- **A.** Yes, Member + Librarian roles **(Recommended)**
- **B.** No, books are seeded in the database and members return books themselves

**Recommendation:** A. Physical books need a human to confirm returns, otherwise a member
could mark a book returned and avoid the late fine.

**Answer:** A — decided by product owner on 2026-10-20.
