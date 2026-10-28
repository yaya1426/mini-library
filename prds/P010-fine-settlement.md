# P010 — Fine Settlement and Borrowing Block

| Field | Value |
| --- | --- |
| ID | P010 |
| Status | Accepted |
| Area | Fines |
| Created | 2026-10-20 |
| Related | P003, P006, P009 |

## Context

P009 creates fines, but we have not decided how they get paid or what happens if a member
doesn't pay.

## Decision

Fines are recorded in the system and paid in person. Members with unpaid fines cannot
borrow new books.

## Rules

- A member can see each fine and their total outstanding amount.
- Fines are paid in person at the library; a librarian marks them as paid. No online
  payment in v1 (P010-Q1).
- Any unpaid fine, of any amount, blocks new borrows until it is paid (P010-Q2).
  Message: "Settle your outstanding fines before borrowing."

## Acceptance criteria

- [ ] A member can see their total outstanding fines.
- [ ] A paid fine no longer counts as outstanding.
- [ ] A member with any unpaid fine cannot borrow.
- [ ] Only a librarian can mark a fine as paid.

## Open questions

### P010-Q1 — How are fines paid?

- **A.** In person at the library; a librarian marks the fine as paid **(Recommended)**
- **B.** Online payment inside the app (card, wallet)

**Recommendation:** A. Online payments need a payment provider and refund handling, which
is a large scope for a mini library.

**Answer:** A — decided by product owner on 2026-10-20.

### P010-Q2 — Do unpaid fines block borrowing?

- **A.** Yes, any unpaid fine blocks new borrows until paid **(Recommended)**
- **B.** Only when unpaid fines exceed a threshold (e.g. 50 EGP)
- **C.** No, fines never block borrowing

**Recommendation:** A. Without a block there is no real consequence to ignoring a fine,
and the rule is easy for members to understand.

**Answer:** A — decided by product owner on 2026-10-20.
