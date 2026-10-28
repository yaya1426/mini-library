# P008 — Returning a Book

| Field | Value |
| --- | --- |
| ID | P008 |
| Status | Accepted |
| Area | Returns |
| Created | 2026-10-20 |
| Related | P003, P005, P009 |

## Context

The return date decides whether a fine is charged (P009), and returning a book frees a
copy (P005) and a member's slot (P006).

## Decision

Returning a book closes the active loan, records the return date, and makes the copy
available again.

## Rules

- Only a librarian records a return, when the physical book is handed back (P008-Q1).
  Members have no "Return" action in the app.
- The return date is the date the librarian records the return.
- On return, the fine for that loan (if any) is finalized (P009).

## Acceptance criteria

- [ ] After a return, the loan is no longer active.
- [ ] The copy becomes available and the member's active-loan count drops by 1.
- [ ] A late return creates a fine according to P009.

## Open questions

### P008-Q1 — Who records that a book was returned?

- **A.** A librarian, when the physical book is handed back **(Recommended)**
- **B.** The member presses "Return" in the app

**Recommendation:** A. With B a member could press "Return" without bringing the book back
and avoid the late fine. Depends on P003-Q1 being "Yes".

**Answer:** A — decided by product owner on 2026-10-20.
