# P011 — Due-Date Reminders

| Field | Value |
| --- | --- |
| ID | P011 |
| Status | Accepted |
| Area | Notifications |
| Created | 2026-10-20 |
| Related | P007, P009 |

## Context

Reminders help members return books on time and avoid fines (P009).

## Decision

Members are reminded inside the app when a loan is close to its due date or overdue.

## Rules

- Reminders are in-app only; no email or SMS in v1 (P011-Q1).
- A warning appears when a loan is due within 2 days.
- Overdue loans are shown prominently with the running fine.

## Acceptance criteria

- [ ] A loan due within 2 days shows a warning.
- [ ] An overdue loan is highlighted with its current fine.

## Open questions

### P011-Q1 — How should members be reminded?

- **A.** In-app only **(Recommended)**
- **B.** In-app + email
- **C.** No reminders

**Recommendation:** A. Free to build with no external provider. Email can be added
together with email verification later (P001-Q2).

**Answer:** A — decided by product owner on 2026-10-20.
