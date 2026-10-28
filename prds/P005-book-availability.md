# P005 — Book Availability by Copies

| Field | Value |
| --- | --- |
| ID | P005 |
| Status | Accepted |
| Area | Catalog |
| Created | 2026-10-20 |
| Related | P004, P006 |

## Context

A book can have several physical copies. A member can borrow a book only if at least one
copy is not already lent out.

## Decision

Availability is tracked per copy. A book can be borrowed only when it has at least one
available copy.

## Rules

- **Available copies** = total copies − copies on active loans.
- Available copies > 0: the book page says the book is available and shows "Borrow"
  (if the member is eligible under P006, P010).
- Available copies = 0: the page says the book is unavailable and "Borrow" is disabled.
- Borrowing assigns one specific available copy to the member.
- The same copy can never be on two active loans, even if two members press "Borrow"
  at the same moment. Availability is re-checked on the server when borrowing.
- No reservations or waiting lists in v1 (P005-Q1).

## Acceptance criteria

- [ ] The book page shows the number of available copies.
- [ ] Borrowing reduces available copies by 1; returning increases it by 1.
- [ ] A book with 0 available copies cannot be borrowed.
- [ ] Two simultaneous borrows of the last copy result in exactly one success.

## Open questions

### P005-Q1 — Can members reserve or join a waiting list for an unavailable book?

- **A.** No, not in v1 **(Recommended)**
- **B.** Yes, a first-come waiting list; the next member gets notified when a copy returns

**Recommendation:** A. Waiting lists add holding periods, expiry, and notifications. Worth
doing once we see demand for popular books.

**Answer:** A — decided by product owner on 2026-10-20.
