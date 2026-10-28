# T003 — Full-Stack Next.js with Server Actions for Mutations

| Field | Value |
| --- | --- |
| ID | T003 |
| Status | Accepted |
| Area | Architecture |
| Date | 2026-10-20 |
| Related | T001, T004, T005, T006 |

## Context

The app is used only by its own UI; no external client consumes it. Building a REST API
inside Next.js would add a layer (routes, request parsing, fetch calls) without a consumer
that needs it.

## Decision

Next.js is the full stack. **All mutations are Server Actions.** We do **not** build API
routes (Route Handlers under `app/**/route.ts`) for the app's own features.

## Rules

- **Writes** (sign up, log in, log out, borrow, return, mark fine paid, manage books) are
  Server Actions (`"use server"`), called from forms or client components.
- **Reads** happen in Server Components, which call `server-only` query functions in the
  actions layer (T006). Reads are not Server Actions, so they are not exposed as HTTP
  endpoints. No fetch calls from the browser to our own server for data.
- Every Server Action is a public endpoint, so each one must:
  1. Check the user is logged in and has the right role (P002, P003).
  2. Validate all input on the server with Zod (T005); never trust form data.
  3. Re-check business rules on the server, even if the UI already hid the button
     (e.g. 3-book limit, overdue block, unpaid fines: P006, P010).
- Business rules live in a server-only domain/service layer. Server Actions are thin:
  authenticate → validate → call the service → revalidate the affected pages.
- After a successful mutation, the action revalidates or redirects so the UI shows fresh
  data (e.g. available copies after a borrow).
- Actions return expected failures (e.g. "You already have 3 books borrowed") as a result
  value the form can display, not as thrown errors.
- **Exception:** a Route Handler is allowed only when something outside our UI must call
  us over HTTP (e.g. a third-party webhook or an auth library callback). Each exception
  needs its own TDR.

## Alternatives considered

| Option | Why not |
| --- | --- |
| REST API via Route Handlers + client fetch | Extra layer with no external consumer. |
| Separate backend service | Two deployments and an API contract for a small app. |
| tRPC / GraphQL | Extra tooling that Server Actions already cover for this use case. |

## Consequences

- Positive: Less code; forms call server functions directly with end-to-end types.
- Positive: Forms work with progressive enhancement.
- Trade-off: No public API. If a mobile app or external client is needed later, a new
  TDR must add one.
- Trade-off: Every action needs explicit auth and validation, because actions are
  reachable by direct HTTP requests.
