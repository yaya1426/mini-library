# T006 — Layered Architecture

| Field | Value |
| --- | --- |
| ID | T006 |
| Status | Accepted |
| Area | Architecture |
| Date | 2026-10-20 |
| Related | T001, T003, T004, T005 |

## Context

Business rules (borrow limits, due dates, fines) must live in one place, be testable,
and not be mixed with UI or database code.

## Decision

The code is split into four layers, each calling only the layer directly below it:

```
Presentation (app/)  →  Actions  →  Service  →  Repository (Prisma)  →  PostgreSQL
```

Full description: [`engineering/architecture.md`](../engineering/architecture.md).

## Rules

- **Presentation** (`app/`, `components/`): renders UI; calls only the actions layer.
- **Actions** (`actions/`): Server Actions for writes, `server-only` queries for reads;
  handles session, Zod validation (T005), and revalidation; calls only services.
- **Service** (`services/`): all business rules from the PRDs; no Next.js or Prisma
  imports; calls only repositories.
- **Repository** (`repositories/`): the only code that uses Prisma (T004); no business
  rules.
- No skipping layers and no upward imports.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Pages call Prisma directly | Business rules get scattered across pages and actions. |
| Pages call services directly (3 layers) | Auth and validation would be repeated in every page; the actions layer keeps that boundary in one place. |
| Clean/hexagonal architecture with ports and adapters | Too much ceremony for an app of this size. |

## Consequences

- Positive: Business rules are in one layer and can be unit-tested with fake repositories.
- Positive: Swapping or changing the database touches only repositories.
- Trade-off: Simple features still pass through four files.
