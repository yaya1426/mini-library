# T004 — Prisma as the ORM

| Field | Value |
| --- | --- |
| ID | T004 |
| Status | Accepted |
| Area | Data |
| Date | 2026-10-20 |
| Related | T002, T003 |

## Context

The app needs typed, safe access to PostgreSQL (T002) from Server Components and Server
Actions (T003), plus versioned schema changes.

## Decision

Use **Prisma ORM** (latest stable major version at setup time) for all database access
and schema migrations.

## Rules

- The Prisma schema is the single source of truth for the database structure.
- Every schema change goes through a Prisma migration that is committed to the repo.
  No manual changes to the database schema.
- Database access happens only in server-only code (Server Components, Server Actions, the
  domain/service layer). Prisma is never imported into client components.
- Use one shared Prisma client instance for the app, not one per request.
- Multi-step writes (borrow, return, pay fine) use Prisma transactions (T002).
- Constraints that Prisma's schema can't express (e.g. "one active loan per copy" as a
  partial unique index) are added in a migration's SQL.
- Raw SQL is allowed only when Prisma can't express a query, and must use parameters.
- Set up Prisma following the official Prisma getting-started guide for the installed
  version.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Drizzle ORM | Good option, but Prisma was chosen by the team. |
| Raw SQL with `pg` | No generated types; more boilerplate and risk of mistakes. |
| TypeORM / Sequelize | Weaker type safety than Prisma. |

## Consequences

- Positive: Generated types flow from the schema into Server Actions and pages.
- Positive: Migrations give a reviewable history of schema changes.
- Trade-off: A code-generation / setup step is part of the build and dev workflow.
