# P006 — Maximum 3 Concurrent Loans

| Field | Value |
| --- | --- |
| ID | P006 |
| Status | Accepted |
| Area | Borrowing |
| Created | 2026-10-20 |
| Related | P005, P007, P010 |

## Context

Limiting how many books one member holds keeps books available for everyone.

## Decision

A member can have **at most 3 active loans** at the same time.

## Rules

- Only active (not yet returned) loans count toward the limit.
- Returning a book frees one slot immediately.
- A member with 3 active loans sees: "You already have 3 books borrowed. Return one to
  borrow another."
- A member cannot borrow a second copy of a book they already have on an active loan
  (P006-Q1). Message: "You already borrowed this book."
- A member with any overdue loan cannot borrow, even with fewer than 3 loans, until all
  overdue books are returned (P006-Q2). Message: "Return your overdue books before
  borrowing new ones."

## Examples

| Active loans | Can borrow another? |
| --- | --- |
| 0, 1, or 2 | Yes |
| 3 | No, must return one first |

## Acceptance criteria

- [ ] A member with 3 active loans cannot borrow a 4th book.
- [ ] After returning one book, that member can borrow again.
- [ ] A member cannot borrow a book they already hold.
- [ ] A member with an overdue loan cannot borrow any book.

## Open questions

### P006-Q1 — Can a member borrow two copies of the same book at once?

- **A.** No, one copy per book per member **(Recommended)**
- **B.** Yes, as long as the total stays at 3 or fewer

**Recommendation:** A. A member has no reason to hold two copies of the same title, and it
blocks other members from that book.

**Answer:** A — decided by product owner on 2026-10-20.

### P006-Q2 — Should a member with an overdue book be blocked from borrowing new books?

- **A.** Yes, until all overdue books are returned **(Recommended)**
- **B.** No, only the 3-book limit applies

**Recommendation:** A. Otherwise a member could keep one book late indefinitely while
continuing to borrow others. The block pushes the late book back to the library.

**Answer:** A — decided by product owner on 2026-10-20.
