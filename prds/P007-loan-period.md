# P007 — 14-Day Loan Period

| Field | Value |
| --- | --- |
| ID | P007 |
| Status | Accepted |
| Area | Borrowing |
| Created | 2026-10-20 |
| Related | P006, P009 |

## Context

Members need a clear deadline to return each book, and late fines (P009) need a date to
count from.

## Decision

Every loan has a due date of **borrow date + 14 days**. Each book has its own due date,
counted from the day that specific book was borrowed.

## Rules

- Dates use the library's time zone: Africa/Cairo.
- The member can see each loan's borrow date, due date, and days remaining.
- Days are calendar days, including weekends and holidays (P007-Q1).
- Loans cannot be renewed or extended in v1 (P007-Q2).

## Examples

| Borrowed on | Due on |
| --- | --- |
| 2026-10-01 | 2026-10-15 |
| 2026-10-20 | 2026-11-03 |

## Acceptance criteria

- [ ] A new loan's due date is exactly 14 days after its borrow date.
- [ ] Two books borrowed on different days have different due dates.

## Open questions

### P007-Q1 — Are the 14 days calendar days or working days?

- **A.** Calendar days, including weekends and holidays **(Recommended)**
- **B.** Working days only

**Recommendation:** A. Simple to explain and compute. Working days need a holiday calendar
that someone has to maintain.

**Answer:** A — decided by product owner on 2026-10-20.

### P007-Q2 — Can a member renew (extend) a loan?

- **A.** No renewals in v1 **(Recommended)**
- **B.** One renewal of 14 more days, only if the loan is not overdue

**Recommendation:** A. Keeps the rules strict and simple for launch. B is a good, easy
addition later if members ask for it.

**Answer:** A — decided by product owner on 2026-10-20.
