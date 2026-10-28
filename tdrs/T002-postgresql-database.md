# T002 — PostgreSQL as the Database

| Field | Value |
| --- | --- |
| ID | T002 |
| Status | Accepted |
| Area | Data |
| Date | 2026-10-20 |
| Related | T004, P005, P006, P009 |

## Context

The data is relational: members have loans, loans point to copies, copies belong to books,
loans produce fines. Borrowing rules must stay correct under concurrent requests, for
example two members borrowing the last copy at the same moment (P005). Loans and fines
involve scarce copies and money, so we need **ACID transactions**: a borrow or return
either fully happens or doesn't happen at all.

Schema and ERD: [`engineering/database.md`](../engineering/database.md).

## Decision

Use **PostgreSQL** as the only database, on the latest stable major version available at
setup time.

## Rules

- All application data lives in PostgreSQL. No second data store in v1.
- Integrity rules are enforced in the database where possible, not only in code:
  - Foreign keys between users, books, copies, loans, and fines.
  - Unique email per user (P001).
  - At most one active loan per copy (P005), so a copy can never be lent twice.
- Multi-step writes (borrow, return, pay fine) run inside a **transaction**.
- Timestamps are stored in UTC (`timestamptz`). Day counting for due dates and fines is
  done in the `Africa/Cairo` time zone (P007, P009).
- Money is stored as an **integer number of EGP**, never as a floating-point value. Fines
  are always whole pounds (5 EGP × days, P009).
- The connection string comes from the `DATABASE_URL` environment variable and is never
  committed.

## Alternatives considered

| Option | Why not |
| --- | --- |
| MySQL | Viable, but PostgreSQL has stronger constraint support (e.g. partial unique indexes for "one active loan per copy"). |
| SQLite | Weak fit for concurrent writes and production hosting. |
| MongoDB | Data is relational; joins and transactional rules are core to the domain. |

## Consequences

- Positive: The database itself guarantees the critical rules even if application code
  has a bug.
- Trade-off: Needs a running PostgreSQL server in development and production.
