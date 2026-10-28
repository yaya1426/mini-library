# P009 — Late Fine of 5 EGP per Day

| Field | Value |
| --- | --- |
| ID | P009 |
| Status | Accepted |
| Area | Fines |
| Created | 2026-10-20 |
| Related | P007, P008, P010 |

## Context

Members must return books within 14 days (P007). A fine encourages them to respect the
due date.

## Decision

For every day a book is kept past its due date, the member is charged **5 EGP**.

## Rules

```
days late = return date − due date   (whole calendar days, minimum 0)
fine      = days late × 5 EGP
```

- Returned on or before the due date: no fine.
- Each overdue book has its own fine.
- A day counts as late from the day after the due date (Cairo time).
- While the book is still out, the fine keeps growing by 5 EGP per day and the member can
  see the running amount. It is finalized when the book is returned.
- There is no maximum fine in v1. Lost books are handled manually by a librarian
  (P009-Q1).

## Examples

Borrowed 2026-10-01, due 2026-10-15:

| Returned on | Days late | Fine |
| --- | --- | --- |
| 2026-10-15 | 0 | 0 EGP |
| 2026-10-16 | 1 | 5 EGP |
| 2026-10-20 | 5 | 25 EGP |
| 2026-11-14 | 30 | 150 EGP |

Two books returned 2 and 4 days late: 10 + 20 = **30 EGP** total.

## Acceptance criteria

- [ ] Returning on or before the due date creates no fine.
- [ ] Returning N days late creates a fine of N × 5 EGP.
- [ ] An unreturned overdue book shows a fine that grows by 5 EGP each day.

## Open questions

### P009-Q1 — Is there a maximum fine per book?

- **A.** No cap in v1; lost books are handled manually by a librarian **(Recommended)**
- **B.** Cap the fine at a fixed amount (e.g. 150 EGP = 30 days)
- **C.** After a set number of days the book is declared lost and the member pays its price

**Recommendation:** A. Matches the rule as you stated it. Caps and lost-book policies can
be added as a separate PRD once we know book prices.

**Answer:** A — decided by product owner on 2026-10-20.
