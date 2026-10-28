---
name: implement-task
description: Implement a planned, ready engineering task from engineering/tasks/ in strict alignment with the active codebase, 4-layer architecture, database design, PRDs, and TDRs. Enforces readiness gates (Todo/Ready status, 0 unanswered open questions, completed dependencies), performs pre-flight and mid-implementation drift detection with zero assumptions via AskQuestion, executes bottom-up across layers, and verifies acceptance criteria before marking the task Done. Use when implementing, building, or coding a Txxx task from engineering/tasks/.
---

# Implement Engineering Task

Implement planned tasks under `engineering/tasks/T###-*.md` with strict adherence to the task's planned business case (`What`, `Why`, `How`), the active codebase, [`engineering/architecture.md`](../../engineering/architecture.md), [`engineering/database.md`](../../engineering/database.md), [`prds/`](../../prds/README.md), and [`tdrs/`](../../tdrs/README.md)—with **zero assumptions** before or during implementation.

## Core Rules

1. **Readiness Gate (Must Be Ready Before Coding)**:
   - A task can only be implemented when **all four readiness conditions** hold:
     1. **Task Status**: The task's `Status` in `engineering/tasks/T###-*.md` and `engineering/tasks/README.md` is `Todo` or `Ready` (or `In Progress` when resuming an already-started implementation)—never `Blocked` or `Done`.
     2. **Zero Unanswered Open Questions**: `Open questions` has `0` unanswered items (`0 of N`), and no `### T###-Q#` entry under `## Open Questions` has `**Answer:** _pending_`.
     3. **Dependencies Complete**: Every prerequisite task listed in `Depends on` has `Status: Done` in `engineering/tasks/README.md`.
     4. **Accepted PRDs & TDRs**: Every referenced `P###` and `T###` has `Status: Accepted` (not `Proposed`, `Rejected`, or `Superseded`) and no unanswered `P###-Q#` / `T###-Q#` questions that affect this task.
   - If **any** readiness condition fails, **stop immediately before writing code**, report the exact blocker(s), and use `AskQuestion` to ask the user how to proceed.
2. **Zero Assumptions — Analyze & Ask on Any Issue or Drift**:
   - **Never guess, improvise, or silently work around** an ambiguity, missing prerequisite, signature mismatch, schema discrepancy, or PRD/TDR conflict.
   - If you discover any issue or drift—whether during the pre-implementation audit or mid-implementation while writing code:
     1. **Pause implementation** on the affected part immediately.
     2. **Analyze the issue in full**: identify what the task planned vs. what the codebase, PRD (`P###`), or TDR (`T###`) actually has, and why they conflict.
     3. **Ask the user via `AskQuestion`**: present the analysis with at least 2 concrete options and mark the best-fitting option `(Recommended)`.
     4. **Record and sync**: log the resolution under `## Open Questions` (`T###-Q#`) in the task file, and if a business or technical decision changed, update `prds/`, `tdrs/`, reference docs (`architecture.md`, `database.md`, `design-system/`), and any affected `T###` tasks before continuing.
3. **Strict Scope & Business Case Fidelity**:
   - Implement **only** what is specified in the target task's `What`, `Why`, `How`, and `Acceptance Criteria`.
   - Do not sneak in scope from downstream `T###` tasks (for example, do not build Layer 1 UI in a backend-only task if `How` explicitly scopes the task to Layers 2–4).
4. **Architecture, Database & Design System Invariants**:
   - Enforce the four-layer dependency direction (`Presentation` → `Actions` → `Service` → `Repository`, `T006`):
     - **Layer 4 (`src/repositories/`)**: The **only** layer that imports `@prisma/client` (`T004`). Accepts optional `tx?: DbClient` on queries/writes, returns plain domain types, and contains zero business rules.
     - **Layer 3 (`src/services/`)**: Pure TypeScript business rules (`P###`), throws `DomainError` with typed codes, orchestrates multi-step writes with `withTransaction` (`T002`, `T006`), and **never** imports from `next/*` or `@prisma/client`.
     - **Layer 2 (`src/actions/`)**: `*.actions.ts` (`"use server"` mutations, `T003`) and `*.queries.ts` (`import "server-only"` reads). Order of operations: authenticate (`requireUser`) → validate with Zod (`T005`) → call one service function → `revalidatePath` / `redirect` or map `DomainError` to `{ ok: false, error }`.
     - **Layer 1 (`src/app/`, `src/components/`, `messages/`)**: Server Components fetch via `*.queries.ts`; Client Components (`"use client"`) handle interactivity and submit to `*.actions.ts`. Follow the neo-brutalist monochrome design system (`T007`–`T009`, `P012`) and bilingual `ar` (RTL) / `en` (LTR) `next-intl` rules (`T010`, `P013`).
   - All due-date and late-fine day math must use `Africa/Cairo` calendar days (`src/lib/dates.ts`, `P007`, `P009`, `T002`), and money is always whole integer EGP (`T002`).
5. **Full Status & Verification Lifecycle**:
   - Transition the task `Status` to `In Progress` in both `engineering/tasks/T###-*.md` and `engineering/tasks/README.md` before writing code.
   - Verify all changes (lint, typecheck, tests/build) and check off every verified criterion (`- [x]`) under `## Acceptance Criteria` before marking `Status: Done` in both files.

---

## Task Implementation Workflow

Copy and follow this checklist for every task implementation request:

```
Task Implementation Progress:
- [ ] Step 1: Load target T### task, engineering/tasks/README.md, and verify Readiness Gates
- [ ] Step 2: Load governing PRDs, TDRs, architecture.md, database.md, and design-system docs
- [ ] Step 3: Audit active codebase for drift, missing prerequisites, or conflicts (ask via AskQuestion if any)
- [ ] Step 4: Mark task Status as In Progress in T###-*.md and engineering/tasks/README.md
- [ ] Step 5: Implement How steps bottom-up across layers ( pausing to ask via AskQuestion if mid-flight issues arise)
- [ ] Step 6: Run verification checks (typecheck, lint, tests/build) and validate every Acceptance Criterion
- [ ] Step 7: Check off [x] Acceptance Criteria and mark Status as Done in T###-*.md and engineering/tasks/README.md
```

### Step 1: Verify Task Readiness Gates

1. Read `engineering/tasks/README.md` and the target `engineering/tasks/T###-*.md` file in full.
2. Check the four readiness gates:
   - Is `Status` equal to `Todo` or `Ready` (or `In Progress` if continuing work)?
   - Are there `0` unanswered open questions (`Open questions: 0 of N` and no `_pending_` answers in `## Open Questions`)?
   - Is every task in `Depends on` marked `Done` in `engineering/tasks/README.md`?
   - Are all cited `P###` and `T###` records `Accepted` in `prds/README.md` and `tdrs/README.md`?
3. **If any gate fails**:
   - Do **not** start coding.
   - Explain clearly which gate failed (e.g., prerequisite `T001` is still `Todo`, or `T###-Q1` is `_pending_`).
   - Call `AskQuestion` with concrete options—for example:
     - Implement the prerequisite task(s) first `(Recommended)`
     - Resolve the pending open question(s) now
     - Run `/groom-task` on `T###` first

### Step 2: Load Governing Product, Architecture & Technical Context

1. Read `engineering/architecture.md` and all `tdrs/T###-*.md` files listed in the task's `TDRs` metadata field.
2. Read all `prds/P###-*.md` files listed in the task's `PRDs` metadata field, including their answered `P###-Q#` decisions and acceptance criteria.
3. **If the task touches persistence, Prisma models, migrations, seeds, locks, or queries**:
   - Read `engineering/database.md`, `tdrs/T002-postgresql-database.md`, and `tdrs/T004-prisma-orm.md`.
4. **If the task touches UI, layouts, components, styling, or translations**:
   - Read `engineering/design-system/README.md`, `tokens.md`, `components.md`, `usage.md`, `tdrs/T007`–`T010`, `prds/P012-visual-identity.md`, and `prds/P013-ui-language.md`.

### Step 3: Pre-Implementation Codebase & Drift Check

Inspect the existing files in the repository that the task creates, modifies, or imports:

1. Check existing files across `prisma/`, `src/lib/`, `src/schemas/`, `src/repositories/`, `src/services/`, `src/actions/`, `src/components/`, `src/app/`, and `messages/`.
2. Verify that every function, type, schema, `DomainError` code, Prisma model, and route assumed by the task's `How` section exists and matches the expected signature.
3. **If you detect any drift, ambiguity, missing contract, or conflict**:
   - Do **not** guess or silently adapt the business/technical contract.
   - Present a clear analysis of the discrepancy (what `T###` planned vs. what exists in the codebase or PRDs/TDRs).
   - Call `AskQuestion` with concrete options and a `(Recommended)` choice.
   - After the user answers, update the task file (`How`, `Acceptance Criteria`, `Open Questions`) and sync any affected PRD/TDR/engineering doc before proceeding.

### Step 4: Mark Task `In Progress`

Once the readiness check and codebase audit are clean (or all questions are resolved):
1. Update `Status` to `In Progress` in `engineering/tasks/T###-short-kebab-title.md`.
2. Update the task's `Status` column to `In Progress` in `engineering/tasks/README.md`.

### Step 5: Execute Implementation Bottom-Up Across Layers

Implement only the sections present in the task's `## How` in bottom-up order so each layer builds on verified foundations:

1. **Database & Schema (`prisma/`)** _(if applicable — `T002`, `T004`, `database.md`)_:
   - Update `prisma/schema.prisma`, create/apply migrations (including raw SQL for partial unique indexes, `CHECK` constraints, composite FKs, `citext`, `pg_trgm`), and update `prisma/seed.ts` as specified.
2. **Shared Schemas & Utilities (`src/schemas/`, `src/lib/`)** _(if applicable — `T005`)_:
   - Implement or extend cross-cutting helpers (`src/lib/errors.ts`, `src/lib/dates.ts`, `src/lib/session.ts`, `src/lib/env.ts`) and Zod schemas (`src/schemas/*.schema.ts`) with exported `z.infer` types.
3. **Layer 4 — Repository (`src/repositories/`)** _(if applicable — `T004`, `T006`)_:
   - Implement repository functions using the single Prisma instance in `src/repositories/db.ts`.
   - Accept `tx?: DbClient` so services can compose operations inside `withTransaction`.
   - Map database constraint violations where specified and return plain domain objects (never leak Prisma-generated types above Layer 4).
4. **Layer 3 — Service (`src/services/`)** _(if applicable — `T006`)_:
   - Implement pure TypeScript business logic enforcing every cited `P###` rule.
   - Throw `DomainError` with the exact error codes specified in the task.
   - Wrap multi-step writes and `FOR UPDATE` locks inside `withTransaction`.
   - Confirm zero imports from `next/*` or `@prisma/client`.
5. **Layer 2 — Actions & Queries (`src/actions/`)** _(if applicable — `T003`, `T005`, `T006`)_:
   - In `*.actions.ts` (`"use server"`): authenticate → validate input with Zod → call service → `revalidatePath` / `redirect` or catch `DomainError` and return `{ ok: false, error, fieldErrors }`.
   - In `*.queries.ts` (`import "server-only"`): authenticate → validate parameters if applicable → call service and return data for Server Components.
6. **Layer 1 — Presentation & i18n (`src/app/`, `src/components/`, `messages/`)** _(if applicable — `T001`, `T006`–`T010`, `P012`, `P013`)_:
   - Add bilingual translation keys in **both** `messages/ar.json` and `messages/en.json` (no hardcoded user-facing strings).
   - Build Server Components and minimal `"use client"` interactive components using logical CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `border-s-*`) for automatic RTL/LTR mirroring (`T010`) and neo-brutalist monochrome tokens (`3px` black borders, hard offset shadows, `0px` radius, `T007`–`T009`, `P012`).

> **Mid-Implementation Stop-and-Ask Rule**: If an unexpected edge case, compiler/runtime conflict, database constraint issue, or unaddressed requirement surfaces while coding any layer, **do not invent a silent workaround**. Analyze the root cause and ask the user via `AskQuestion` before continuing.

### Step 6: Verify Implementation Against Architecture & Acceptance Criteria

1. **Layer & Architectural Invariant Check**:
   - Verify no forbidden imports exist across layers (e.g., `src/services/` has no `next/*` or `@prisma/client`; `src/actions/` and `src/app/` have no `@prisma/client`; `*.queries.ts` has `import "server-only"`).
   - Verify all rules listed under `### Architectural & Database Rules to Enforce` in the task file are satisfied.
2. **Automated Quality Checks**:
   - Check for diagnostics on edited files using `ReadLints` (if available) and run the project's verification commands (`npm run lint`, `npx tsc --noEmit`, tests, and/or `npm run build` as appropriate for the task).
   - Fix any lint, type, or build issues introduced by the task.
3. **Acceptance Criteria Audit**:
   - Walk through every item in `## Acceptance Criteria` one by one and confirm it is verifiably met by the implementation.

### Step 7: Finalize Task Status & Index

Once all acceptance criteria and verification checks pass:
1. In `engineering/tasks/T###-short-kebab-title.md`:
   - Check off all completed items in `## Acceptance Criteria` (`- [x]`).
   - Update `Status` from `In Progress` to `Done`.
2. In `engineering/tasks/README.md`:
   - Update the task's `Status` in the `## Tasks Index` table to `Done`.
   - If any `Open questions` were added and answered during implementation, update the `Open questions` count (`0 of N`) in both the task file and `engineering/tasks/README.md`.
3. Provide a concise implementation summary listing the files created/updated per layer, verification results, and the updated task status.
