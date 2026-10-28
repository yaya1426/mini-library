# Mini Library — PRD Index

This folder is the **source of truth** for business decisions in the Mini Library project.
If code and a PRD disagree, the PRD wins until it is updated.

## Product in one paragraph

Mini Library is a small online library. Visitors create an account or log in, browse the
catalog, and borrow available copies of books. A member can hold at most 3 books at the
same time, each for 14 days. Every day a book is kept past its due date costs a late fine
of 5 EGP.

## Numbering scheme

- Every PRD is **one independent decision** in its own file.
- IDs are `P` + 3 digits: `P001`, `P002`, … `P999`.
- File name: `P###-short-kebab-title.md` (e.g. `P006-max-concurrent-loans.md`).
- New PRDs take the **next free number**. Numbers are never reused or renumbered, even if a
  PRD is rejected or replaced; that keeps references in code, tests, and commits stable.
- Open questions inside a PRD are numbered `P###-Q#` (e.g. `P006-Q2`).
- To change an accepted decision, write a **new** PRD and mark the old one
  `Superseded by P0xx`.
- New PRDs start from [`_template.md`](_template.md).

## Statuses

| Status | Meaning |
| --- | --- |
| Accepted | The core decision is final. It may still have open questions about details. |
| Proposed | Suggested by the team, waiting for the product owner's decision. |
| Rejected | Considered and not adopted. Kept for history. |
| Superseded | Replaced by a newer PRD (linked in the file). |

## Index

| ID | Title | Area | Status | Open questions |
| --- | --- | --- | --- | --- |
| [P001](P001-member-registration.md) | Member registration | Auth | Accepted | 0 of 2 |
| [P002](P002-login-and-protected-access.md) | Login and protected access | Auth | Accepted | 0 of 1 |
| [P003](P003-librarian-role.md) | Librarian role | Roles | Accepted | 0 of 1 |
| [P004](P004-catalog-browsing.md) | Catalog browsing | Catalog | Accepted | 0 of 1 |
| [P005](P005-book-availability.md) | Book availability by copies | Catalog | Accepted | 0 of 1 |
| [P006](P006-max-concurrent-loans.md) | Maximum 3 concurrent loans | Borrowing | Accepted | 0 of 2 |
| [P007](P007-loan-period.md) | 14-day loan period | Borrowing | Accepted | 0 of 2 |
| [P008](P008-book-return.md) | Returning a book | Returns | Accepted | 0 of 1 |
| [P009](P009-late-fine.md) | Late fine of 5 EGP per day | Fines | Accepted | 0 of 1 |
| [P010](P010-fine-settlement.md) | Fine settlement and borrowing block | Fines | Accepted | 0 of 2 |
| [P011](P011-due-date-reminders.md) | Due-date reminders | Notifications | Accepted | 0 of 1 |
| [P012](P012-visual-identity.md) | Visual identity | Brand / UI | Accepted | 0 of 0 |
| [P013](P013-ui-language.md) | UI language (Arabic + English) | Brand / UI | Accepted | 0 of 1 |

"Open questions" shows unanswered / total. Answered questions stay in each PRD with their
answer, as a record of why the decision was made.

Next free number: **P014**

## Glossary

| Term | Meaning |
| --- | --- |
| Visitor | Someone not logged in. |
| Member | A registered, logged-in user who can borrow books. |
| Librarian | Staff user who manages books, returns, and fines (see P003). |
| Book | A title in the catalog. Has one or more copies. |
| Copy | One physical item of a book that can be lent out. |
| Available copy | A copy that is not on an active loan. |
| Loan | A record that a member borrowed a specific copy. |
| Active loan | A loan that has not been returned yet. |
| Due date | Borrow date + 14 days (P007). |
| Overdue | An active loan whose due date has passed. |
| Fine | 5 EGP × days late (P009). |

## Change log

| Date | Change |
| --- | --- |
| 2026-10-20 | Initial requirements captured |
| 2026-10-20 | Restructured into one-decision-per-file PRDs P001–P011 |
| 2026-10-20 | Product owner answered all 15 open questions (all recommended options); P003, P008, P010, P011 moved to Accepted |
| 2026-10-20 | Added P012 (visual identity: neo-brutalist, black and white) |
| 2026-10-20 | Added P013 (UI in Arabic and English, Arabic default) |
