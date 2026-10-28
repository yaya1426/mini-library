# T001 — Next.js 16 as the Application Framework

| Field | Value |
| --- | --- |
| ID | T001 |
| Status | Accepted |
| Area | Framework |
| Date | 2026-10-20 |
| Related | T003 |

## Context

The Mini Library needs a web UI (sign up, catalog, book page, my loans, librarian screens)
and server-side business logic (borrowing rules, fines). We want one framework and one
codebase for both.

## Decision

Build the application with **Next.js 16**, the latest major version at project start,
using the **App Router**.

## Rules

- Scaffold the project with the official tool:
  ```
  npx create-next-app@latest
  ```
  The generated setup (versions, config files, folder layout) is the baseline; don't
  hand-roll an equivalent setup.
- Use the **App Router** (`app/` directory). The Pages Router (`pages/`) is not used.
- Pages are **Server Components** by default. Add `"use client"` only to components that
  need browser interactivity (forms with live state, buttons with client handlers).
- Upgrades to a new Next.js major version require a new TDR.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Separate React SPA + Node/Express API | Two codebases and an HTTP API to maintain for a small app. |
| Older Next.js version | No reason to start a new project on an older major version. |
| Next.js Pages Router | Doesn't support Server Components or Server Actions, which T003 depends on. |

## Consequences

- Positive: UI and server logic live in one TypeScript codebase and one deployment.
- Positive: Server Components let pages read data directly on the server (T003).
- Trade-off: We follow Next.js conventions and its release cycle.
