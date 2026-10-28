---
name: groom-task
description: Groom and revalidate existing engineering tasks in engineering/tasks/ from both a product (PRD) and technical (TDR, architecture, database, and active codebase) perspective. Detects stale plans, codebase drift, partial implementations, and PRD/TDR changes, asks the user via AskQuestion with zero assumptions before rewriting, and checks ripple effects on dependent Txxx tasks. Use after /plan-task, before implementing a task, or when the user mentions grooming a task, checking if a Txxx task is stale, or reconciling a task with the current codebase.
---

# Groom Engineering Task

Groom existing planned tasks under `engineering/tasks/T###-*.md` before or during implementation by auditing the task against the **active codebase**, **current PRDs**, **current TDRs**, **architecture/database docs**, and **prerequisite tasks**—resolving every staleness or conflict with the user via `AskQuestion` (zero assumptions) and propagating any contract changes to dependent `T###` tasks.

## Core Rules

1. **Product + Technical + Codebase Triangulation**:
   - A planned task goes stale when any of three things evolve after `/plan-task` ran:
     1. **Active Codebase (`prisma/`, `src/`, `messages/`)**: Prerequisite tasks were implemented with different file names, function signatures, schemas, error codes, or Prisma models—or parts of the target task were already built.
     2. **Product Decisions (`prds/`)**: A referenced `P###` was updated, had open questions (`P###-Q#`) answered, was superseded, or a new `P###` introduced rules affecting this feature.
     3. **Technical Decisions & Docs (`tdrs/`, `engineering/`)**: A referenced `T###` TDR, `engineering/architecture.md`, `engineering/database.md`, or `engineering/design-system/` changed, or upstream `T###` tasks in `engineering/tasks/` changed their scope or contracts.
   - Always inspect **all three sources** before declaring a task ready or proposing edits.
2. **Zero Assumptions — Ask Before Rewriting**:
   - **Never silently rewrite** a task's business rules, layer boundaries, function contracts, database constraints, or scope when drift is found.
   - Flag every detected discrepancy (codebase drift, PRD/TDR conflict, prerequisite task mismatch, or unaddressed edge case) and use `AskQuestion` to ask the user how to reconcile it before modifying the task file.
   - Every unresolved or newly surfaced question must be recorded under `## Open Questions` in the task file (`T###-Q#`) with concrete options, a recommendation, and `**Answer:** _pending_` (or the user's chosen resolution).
   - If any open question remains unanswered, set the task's `Status` to `Blocked` in both the task file and `engineering/tasks/README.md`.
3. **Single-Problem Integrity**:
   - Verify the task still solves **one cohesive problem only**. If codebase evolution or new PRD requirements expanded the task into multiple distinct problems, propose splitting the overflow into a new sequential `T###` task via `AskQuestion`.
4. **PRD & TDR Synchronization**:
   - `prds/` is the source of truth for business rules; `tdrs/` is the source of truth for technical decisions.
   - If the user's resolution during grooming changes a business rule or technical decision (e.g., choosing to keep how the codebase currently works instead of an older PRD/TDR rule), update or supersede the corresponding `prds/P###-*.md` or `tdrs/T###-*.md` and sync `engineering/architecture.md`, `engineering/database.md`, or `engineering/design-system/` first.
5. **Downstream Ripple Check**:
   - Whenever grooming changes a task's exported repository functions, Zod schemas, service signatures, `DomainError` codes, Server Actions/Queries, routes, or scope, inspect all downstream `T###` tasks in `engineering/tasks/` that list this task in `Depends on` and align them (asking the user first if any downstream change is non-trivial).

---

## Task Grooming Workflow

Copy and follow this checklist for every task grooming request:

```
Task Grooming Progress:
- [ ] Step 1: Load target T### task, engineering/tasks/README.md, and upstream/downstream T### tasks
- [ ] Step 2: Audit product alignment against prds/README.md and all relevant prds/P###-*.md files
- [ ] Step 3: Audit technical alignment against tdrs/, engineering/architecture.md, database.md, and design-system/
- [ ] Step 4: Audit active codebase (prisma/, src/, messages/) for impact, drift, and partial implementation
- [ ] Step 5: Present Staleness & Impact Findings and ask the user via AskQuestion (zero assumptions)
- [ ] Step 6: Sync any PRD/TDR updates, rewrite stale sections of T###, and update Open Questions
- [ ] Step 7: Check and sync ripple effects on dependent T### tasks and engineering/tasks/README.md
```

### Step 1: Load Target Task & Dependency Graph

1. Read `engineering/tasks/README.md` to inspect the task index, statuses, and dependency flow.
2. Read the target task file `engineering/tasks/T###-*.md` in full (metadata table, `What`, `Why`, `How`, `Acceptance Criteria`, and `Open Questions`).
3. Read all **prerequisite tasks** listed in `Depends on` and identify all **downstream tasks** that depend on the target task.
4. Check if the target task already has unanswered `T###-Q#` items under `## Open Questions`.

### Step 2: Product Perspective Audit (`prds/`)

1. Read `prds/README.md` (`Index`, `Status`, `Open questions`, and `Change log`).
2. Read every `prds/P###-*.md` cited in the task's `PRDs` field—plus any other `P###` in the same domain that may have been added or updated since the task was planned.
3. Check for **Product Staleness**:
   - Was any cited `P###` marked `Superseded` or `Rejected`?
   - Were new rules, edge cases, or answered `P###-Q#` decisions added to a `P###` that are missing from the task's `What`, `How`, or `Acceptance Criteria`?
   - Are there unanswered `P###-Q#` open questions in a referenced PRD that block this task?
   - Does the task's `How` or `Acceptance Criteria` contradict any rule in `prds/P###-*.md`?

### Step 3: Technical & Architecture Audit (`tdrs/`, `engineering/`)

1. Read `tdrs/README.md` and `engineering/architecture.md`.
2. Read `engineering/database.md` (plus `tdrs/T002-postgresql-database.md` and `tdrs/T004-prisma-orm.md`) if the task touches persistence, Prisma models, SQL constraints, locks, or transactions.
3. Read `engineering/design-system/README.md` (and `tokens.md`, `components.md`, `usage.md`, `T007`–`T010`, `P012`, `P013`) if the task touches UI, styling, or `next-intl` translations.
4. Check for **Technical Doc Staleness**:
   - Was any cited `T###` TDR superseded or modified in `tdrs/README.md`?
   - Does every step in `How` respect the 4-layer dependency rules (`Presentation` → `Actions` → `Service` → `Repository`, `T006`), `"use server"` / `"server-only"` boundaries (`T003`), Zod validation (`T005`), and `DomainError` handling?
   - Did prerequisite `T###` tasks change the names or contracts of shared utilities, repositories, or schemas that this task expects to import?

### Step 4: Active Codebase Impact & Drift Analysis (`prisma/`, `src/`)

Inspect the actual repository files to compare **what the task assumes exists** vs. **what is currently in the codebase**:

1. **Database & Prisma (`prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`)**:
   - Check whether tables, columns, enums, indexes, and raw SQL constraints (`CHECK`, partial unique indexes, `citext`, `pg_trgm`) assumed or planned by the task already exist, are missing, or were implemented with different names/types.
2. **Layer 4 — Repositories (`src/repositories/`)**:
   - Search existing `*.repository.ts` files for functions the task plans to create, extend, or call.
   - Check if `DbClient` transaction parameters (`tx?: DbClient`), return types, or query shapes differ from what `How` describes.
3. **Shared Schemas & Utilities (`src/schemas/`, `src/lib/`)**:
   - Check `src/lib/errors.ts` (`DomainError` codes), `src/lib/dates.ts` (`Africa/Cairo` helpers), `src/lib/auth.ts` (`requireUser`, `SessionUser`), `src/lib/db.ts` (`withTransaction`), and `src/schemas/*.schema.ts` for naming or signature drift.
4. **Layer 3 — Services (`src/services/`)**:
   - Check existing `*.service.ts` files for business logic overlap, existing helper functions, `DomainError` codes thrown, and transaction orchestration patterns.
5. **Layer 2 — Actions & Queries (`src/actions/`)**:
   - Check existing `*.actions.ts` and `*.queries.ts` for action return shapes (`{ ok: true, data } | { ok: false, error }`), auth guards, and `revalidatePath` patterns.
6. **Layer 1 — Presentation & i18n (`src/app/`, `src/components/`, `messages/`)**:
   - Check route structure under `src/app/[locale]/`, existing shared/feature components, and translation keys in `messages/ar.json` and `messages/en.json`.

Classify every codebase finding into one of four buckets:
- **Already Implemented**: Part or all of a planned step already exists in code.
- **Signature / Naming Drift**: Prerequisite code exists in `src/` or `prisma/`, but with different file paths, function names, types, or error codes than the task assumed.
- **Missing Prerequisite**: The task assumes a prerequisite from an earlier `T###` exists in code, but it has not been built yet (or was omitted).
- **Breaking Impact**: Implementing the task as written would break or conflict with existing active code, tests, or database constraints.

### Step 5: Present Staleness Report & Ask Questions (`AskQuestion`)

1. Present a concise **Grooming & Staleness Summary** covering:
   - **Product Alignment (`prds/`)**: Up-to-date vs. stale/conflicting rules.
   - **Technical & Doc Alignment (`tdrs/`, `engineering/`)**: Up-to-date vs. stale rules or prerequisite task changes.
   - **Active Codebase Impact (`prisma/`, `src/`)**: What already exists, what drifted in naming/signatures, what prerequisites are missing, and what active code is impacted.
   - **Downstream Impact**: Which dependent `T###` tasks will be affected if this task changes.
2. **If everything is 100% aligned and no open questions exist**:
   - Report that the task is clean and ready for implementation (`Status: Todo`), and do not make unnecessary edits.
3. **If any staleness, drift, ambiguity, or open question exists**:
   - Call `AskQuestion` immediately. Group each decision clearly:
     - State the exact conflict or drift (citing the `T###` section, `P###`/`T###` ID, and/or file path in `src/` or `prisma/`).
     - Provide at least 2 concrete options with the recommended option first labeled `(Recommended)`.
     - Explicitly note if an option requires updating/superseding a PRD/TDR or updating downstream `T###` tasks.
   - Wait for the user's answers before applying changes.

### Step 6: Reconcile PRDs/TDRs & Update the Target Task File

Once the user answers via `AskQuestion`:

1. **Sync PRDs, TDRs, and Reference Docs First (if a decision changed)**:
   - Update `prds/P###-*.md` + `prds/README.md` or `tdrs/T###-*.md` + `tdrs/README.md`, and propagate to `engineering/architecture.md`, `engineering/database.md`, or `engineering/design-system/`.
2. **Update `engineering/tasks/T###-short-kebab-title.md`**:
   - Keep the required [`engineering/tasks/_template.md`](../../engineering/tasks/_template.md) structure (`What`, `Why`, `How`, `Acceptance Criteria`, `Open Questions`).
   - Update `How` steps so file paths, function names, types, `DomainError` codes, Prisma models, and layer boundaries match the active codebase and current TDRs/PRDs.
   - Remove or mark already-implemented work according to the user's decision, or narrow the task scope to the remaining unbuilt work.
   - Update `Acceptance Criteria` checkboxes so every criterion is testable and traces to current `P###` and `T###` IDs.
   - Record all newly asked questions and their answers in `## Open Questions` (`T###-Q#`), and update the `Open questions` counter (`unanswered of total`) and `Status` (`Todo` if `0` unanswered, `Blocked` if any remain `_pending_`).

### Step 7: Propagate Ripple Effects to Dependent Tasks & Index

1. Inspect each downstream `T###` task that depends on the groomed task:
   - If the groomed task's exported functions, schemas, routes, or scope changed in a way that makes a dependent `T###` task stale, update the dependent task's `Depends on`, `How`, and `Acceptance Criteria` (asking the user via `AskQuestion` if any downstream change involves a design choice).
2. Update `engineering/tasks/README.md`:
   - Sync the target task's (and any updated dependent task's) `One-line description`, `Depends on`, `Status`, `Open questions` count, and `Dependency Flow` diagram.
