# T005 — Zod for Input Validation

| Field | Value |
| --- | --- |
| ID | T005 |
| Status | Accepted |
| Area | Validation |
| Date | 2026-10-20 |
| Related | T003, T006 |

## Context

Server Actions are public HTTP endpoints (T003), so every input must be validated on the
server. We also want input types that match the validation exactly.

## Decision

Use **Zod** (latest stable major version at setup time) to validate all external input.

## Rules

- Every Server Action and query validates its input with a Zod schema before calling a
  service.
- Schemas live in `src/schemas/` and can be shared with forms for client-side hints.
  Client-side validation never replaces the server-side parse.
- Input types are inferred from schemas (`z.infer`), not duplicated by hand.
- Zod checks **shape and format** only. Business rules (3-book limit, unpaid fines, …)
  belong to the service layer (T006).
- Validation failures are returned to the form as per-field errors, not thrown.
- Environment variables (e.g. `DATABASE_URL`) are also validated with Zod at startup.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Manual `if` checks | Repetitive, easy to forget, and types drift from the checks. |
| Valibot / Yup | Viable, but Zod is the team's choice and the most widely used with Next.js. |

## Consequences

- Positive: One definition gives both runtime validation and TypeScript types.
- Trade-off: Schemas must be kept in sync with form fields.
