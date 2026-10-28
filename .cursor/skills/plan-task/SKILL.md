---
name: plan-task
description: Plan and author engineering tasks in engineering/tasks/ by consulting architecture, database schema, PRDs, and TDRs first, and synchronizing PRD/TDR decisions whenever they are introduced or changed. Enforces single-problem tasks, sequential Txxx indexing in engineering/tasks/README.md, duplicate-task detection, zero assumptions with Open Questions, strict TDR/PRD alignment, and the required What, Why, and How structure. Use when planning, creating, splitting, or updating engineering tasks or when the user mentions task planning, Txxx tasks, engineering/tasks, or PRD/TDR changes affecting tasks.
---

# Plan Engineering Task

Plan and maintain implementation tasks under `engineering/tasks/` with strict alignment to the project's architecture, database design, PRDs, and TDRs—and keep `prds/`, `tdrs/`, reference architecture docs, and affected tasks synchronized whenever a business or technical decision changes.

## Core Rules

1. **Location & Indexing**:
   - All tasks live in `engineering/tasks/` and use sequential IDs `T001`, `T002`, … `T999`.
   - File naming format: `engineering/tasks/T###-short-kebab-title.md`.
   - Never reuse or renumber task IDs.
   - Maintain `engineering/tasks/README.md` as the single index holding every task's ID and a **one-line description** so agents can quickly scan all previous tasks.
2. **Duplicate / Overlap Guard**:
   - Before planning, always read `engineering/tasks/README.md` (and any potentially overlapping `T###` task files).
   - If the problem was already planned or solved in a previous task, **do not jump into planning a new task**. Analyze the existing task(s) in full and ask the user what is being solved differently under this task (or whether to update the existing task).
3. **One Problem Per Task**:
   - Every task must solve **one cohesive problem only** (a single business case, architectural foundation, or bug).
   - If the request bundles multiple distinct problems, split them into separate `T###` tasks and order them by dependency.
4. **Architecture, Database, PRDs & TDRs First**:
   - **Always** read `engineering/architecture.md` and `tdrs/README.md` before planning technical steps. Every task's technical plan must respect the active TDRs—including the four-layer architecture (`Presentation` → `Actions` → `Service` → `Repository`, `T006`), Server Actions/queries (`T003`), Zod validation (`T005`), and `DomainError` contracts.
   - **Whenever the task input or requirements touch data, persistence, queries, constraints, indexes, migrations, or seeds**, read `engineering/database.md` along with `tdrs/T002-postgresql-database.md` and `tdrs/T004-prisma-orm.md` before designing the task.
   - **Whenever UI, styling, or localization is involved**, read `engineering/design-system/README.md` along with `tdrs/T007-tailwind-css-v4.md`, `tdrs/T008-shadcn-ui-components.md`, `tdrs/T009-neo-brutalist-design-system.md`, `tdrs/T010-next-intl-i18n.md`, `prds/P012-visual-identity.md`, and `prds/P013-ui-language.md`.
   - Read the full markdown files of every relevant PRD (`prds/P###-*.md`) and TDR (`tdrs/T###-*.md`)—never rely on index titles alone—and verify their status is `Accepted` (never implement a `Superseded` or `Rejected` decision).
5. **PRD & TDR Decision Synchronization (When Decisions Change)**:
   - `prds/` is the source of truth for business decisions; `tdrs/` is the source of truth for technical decisions. A task file in `engineering/tasks/` must **never** silently override a PRD or TDR.
   - **When a user request or Open Question answer changes or adds a PRD/TDR decision**:
     - Update the corresponding PRD (`prds/P###-*.md`) or TDR (`tdrs/T###-*.md`) first—or, if replacing an accepted decision, author a new `P###` / `T###` from `prds/_template.md` / `tdrs/_template.md`, mark the old record `Superseded by P###` / `Superseded by T###`, and update `prds/README.md` or `tdrs/README.md` (Index, `Next free number`, and `Change log`).
     - Propagate any resulting technical or schema changes to `engineering/architecture.md`, `engineering/database.md`, or `engineering/design-system/` so engineering docs stay in sync with TDRs and PRDs.
   - **When an existing PRD or TDR has changed**:
     - Apply the updated TDR/PRD rules to the task being planned, and inspect existing tasks in `engineering/tasks/T###-*.md` that cite the affected `P###` or `T###` so their `PRDs`/`TDRs` links, `How` steps, and `Acceptance Criteria` are updated to match.
6. **Zero Assumptions & Open Questions**:
   - **Never make silent assumptions** in `What`, `Why`, or `How`. Do not invent business rules, schema fields, error behaviors, or UX flows that are not backed by the user's requirements or accepted PRDs/TDRs.
   - When anything is ambiguous, undecided, or conflicts with an existing PRD/TDR:
     - Use the `AskQuestion` tool to ask the user directly with concrete options and a recommended choice (explicitly noting if an option requires updating/superseding a PRD or TDR), **and/or**
     - Record each unresolved decision under `## Open Questions` as `T###-Q#` with options, a recommendation, and `**Answer:** _pending_`.
   - If a task has unanswered open questions, set its status to `Blocked` until the user resolves them.
7. **Required Task Structure (`What`, `Why`, `How`)**:
   - Every task file must follow [`engineering/tasks/_template.md`](../../engineering/tasks/_template.md) and include:
     - **What**: What problem, business case, or bug we are solving.
     - **Why**: Why it is a problem and why we are introducing a task for it now.
     - **How**: How we will solve it as concrete technical steps across the architecture layers and database, citing the governing `T###` and `P###` IDs.
     - **Acceptance Criteria**: Verifiable checkboxes (`- [ ]`) traced to `P###` / `T###`.
     - **Open Questions**: Question log (`T###-Q#`) so zero assumptions are made.

---

## Task Planning Workflow

Copy and follow this checklist for every task planning request:

```
Task Planning Progress:
- [ ] Step 1: Read engineering/tasks/README.md and check for duplicate/overlapping tasks
- [ ] Step 2: Check if the request solves one problem or must be split into multiple T### tasks
- [ ] Step 3: Read engineering/architecture.md, prds/README.md, tdrs/README.md, and all relevant P### / T### files (plus engineering/database.md if data/DB is involved)
- [ ] Step 4: Identify ambiguities or PRD/TDR conflicts and ask the user via AskQuestion (zero assumptions)
- [ ] Step 5: Sync any new or changed PRD/TDR decisions in prds/, tdrs/, reference docs, and affected existing tasks
- [ ] Step 6: Write or update engineering/tasks/T###-short-kebab-title.md applying all governing TDR & PRD decisions
- [ ] Step 7: Update engineering/tasks/README.md index, Next free number, and dependency diagram
```

### Step 1: Consult `engineering/tasks/README.md` & Check for Duplicates

1. Read `engineering/tasks/README.md` first.
2. Scan the one-line descriptions of all existing `Txxx` tasks.
3. **If an existing task already covers the same or overlapping scope**:
   - Read the matching `engineering/tasks/T###-*.md` file(s) completely.
   - Present a concise analysis of what `T###` already covers.
   - Ask the user (via `AskQuestion`) what is being solved differently in this new task, or whether they want to refine the existing `T###` task instead (for example, to reflect a changed PRD or TDR decision).
   - Wait for the user's response before creating a new task file.

### Step 2: Check Single-Problem Scope

1. Verify whether the requirement addresses **one problem** or **multiple independent problems**.
2. If it contains multiple problems (e.g., "add book reservations and build an email notification service"), propose splitting them into separate sequential `T###` tasks with clear `Depends on` links.

### Step 3: Consult Architecture, Database, PRDs, and TDRs

1. **TDRs & Architecture (Mandatory)**: Read `tdrs/README.md`, `engineering/architecture.md`, and every relevant `tdrs/T###-*.md` file to map the solution to the active technical decisions and exact layers:
   - Layer 1 (`src/app/`, `src/components/` — `T001`, `T006`, `T007`, `T008`, `T009`, `T010`): Server Components, Client Components (`"use client"`), `next-intl`, neo-brutalist design system.
   - Layer 2 (`src/actions/` — `T003`, `T005`, `T006`): `*.actions.ts` (`"use server"` mutations) and `*.queries.ts` (`import "server-only"` reads), session check, Zod validation, `DomainError` mapping.
   - Layer 3 (`src/services/` — `T006`): Pure TypeScript business rules, `DomainError` throws, `withTransaction` orchestration.
   - Layer 4 (`src/repositories/` — `T002`, `T004`, `T006`): Prisma queries, `DbClient` transaction support, plain domain return types.
   - Shared (`src/schemas/`, `src/lib/` — `T005`): Zod schemas, helpers.
2. **Database (Mandatory when DB/data is involved)**: Read `engineering/database.md`, `tdrs/T002-postgresql-database.md`, and `tdrs/T004-prisma-orm.md` whenever the task involves:
   - Schema changes, new tables/columns, enums, or Prisma models.
   - Custom SQL constraints (`CHECK`, partial unique indexes, composite FKs, extensions) or migrations.
   - Queries, derived state (e.g., copy availability, overdue status, running fines), or ACID transactions (`FOR UPDATE` row locks, atomic writes).
3. **PRDs & Design System**:
   - Read `prds/README.md` and every applicable `prds/P###-*.md` file in full, including answered `P###-Q#` open questions.
   - Check the `Status` and `Change log` in `prds/README.md` and `tdrs/README.md` to ensure no referenced PRD or TDR has been `Superseded` or modified since earlier tasks were written.
   - Read `engineering/design-system/README.md` (and `tokens.md`, `components.md`, `usage.md`) when UI components or pages are part of the task.

### Step 4: Eliminate Assumptions & Ask Open Questions

1. List any missing details, edge cases, schema decisions, or UX choices not explicitly answered by the user's input or existing docs.
2. **Detect PRD/TDR conflicts**: If the user's request or desired approach differs from an existing `Accepted` PRD (`prds/P###-*.md`) or TDR (`tdrs/T###-*.md`), flag the exact `P###` / `T###` rule and ask the user via `AskQuestion` whether to:
   - Follow the existing `Accepted` PRD/TDR decision, or
   - Change the decision and update/supersede the PRD/TDR accordingly.
3. When calling `AskQuestion`:
   - Provide a clear question prompt explaining the gap or PRD/TDR trade-off.
   - Offer at least 2 concrete options, with the recommended option first labeled `(Recommended)`.
4. Any question that remains open or is answered during planning is documented in `## Open Questions` inside the task file (`T###-Q1`, `T###-Q2`, …) with the rationale and answer.

### Step 5: Sync New or Changed PRD & TDR Decisions

Whenever a business decision (PRD) or technical decision (TDR) is newly introduced or changed (either directly by the user or via an `AskQuestion` resolution):

1. **If a PRD (Business Decision) is added or changed**:
   - **In-place clarification / open question answer on an existing PRD**: Update `prds/P###-*.md` (`Rules`, `Acceptance criteria`, `Open questions`), and update the `Open questions` count and `Change log` in `prds/README.md`.
   - **New business decision or replacement of an accepted PRD**: Create `prds/P###-short-kebab-title.md` from `prds/_template.md` using the `Next free number` in `prds/README.md`. If it replaces a prior PRD, set the old PRD's status to `Superseded by [P###](P###-short-kebab-title.md)`. Update `prds/README.md` (`Index`, `Next free number`, `Glossary` if needed, and `Change log`).
2. **If a TDR (Technical Decision) is added or changed**:
   - **In-place rule refinement / open question answer on an existing TDR**: Update `tdrs/T###-*.md` (`Decision`, `Rules`, `Consequences`, `Open questions`) and record the update in `tdrs/README.md` (`Change log` and `Stack at a glance` if affected).
   - **New technical decision or replacement of an accepted TDR**: Create `tdrs/T###-short-kebab-title.md` from `tdrs/_template.md` using the `Next free number` in `tdrs/README.md`. If it replaces a prior TDR, set the old TDR's status to `Superseded by [T###](T###-short-kebab-title.md)`. Update `tdrs/README.md` (`Index`, `Next free number`, `Stack at a glance`, and `Change log`).
3. **Sync Derived Engineering Docs**:
   - If a TDR or PRD change affects layer boundaries, folder structure, or request flow, update `engineering/architecture.md`.
   - If a TDR or PRD change affects tables, columns, constraints, indexes, or transactions, update `engineering/database.md`.
   - If a TDR or PRD change affects visual tokens, components, or RTL/LTR layout rules, update `engineering/design-system/`.
4. **Propagate to Existing Engineering Tasks (`engineering/tasks/`)**:
   - Search `engineering/tasks/T###-*.md` for references to the changed or superseded `P###` / `T###`.
   - Update any affected task files (metadata `PRDs`/`TDRs` links, `What`, `Why`, `How`, `Architectural & Database Rules to Enforce`, and `Acceptance Criteria`) and `engineering/tasks/README.md` so no planned task relies on outdated TDR/PRD rules.

### Step 6: Draft the Task File (`engineering/tasks/T###-short-kebab-title.md`)

Use the exact structure from [`engineering/tasks/_template.md`](../../engineering/tasks/_template.md), ensuring every applicable TDR and PRD rule is explicitly applied in `How`, `Architectural & Database Rules to Enforce`, and `Acceptance Criteria`:

```markdown
# T### — Title

| Field | Value |
| --- | --- |
| ID | T### |
| Status | Todo |
| Area | Foundation / Data / Presentation / Auth / Catalog / Borrowing / Returns / Fines / … |
| Depends on | None _or_ [T###](T###-slug.md) |
| PRDs | [P###](../../prds/P###-slug.md) |
| TDRs | [T###](../../tdrs/T###-slug.md) |
| Open questions | 0 of 0 |

## What

State clearly what single problem, business case, or bug this task solves and what tangible capability or fix exists when the task is complete.

## Why

Explain why this problem matters and why we are introducing this task now (e.g., which user/business requirement it fulfills, what risk or failure mode it prevents, or which downstream tasks depend on it).

## How

Break down the exact technical steps in execution order across the architecture layers and database (include only the subsections that apply to this task):

### 1. Database & Schema Changes (`prisma/`, `engineering/database.md`) _(if applicable — T002, T004)_
- Exact tables, columns, constraints, indexes, or migrations required per `tdrs/T002-postgresql-database.md`, `tdrs/T004-prisma-orm.md`, and `engineering/database.md`.

### 2. Layer 4 — Repository (`src/repositories/`) _(if applicable — T002, T004, T006)_
- Exact repository functions, inputs, `tx?: DbClient` support, and plain domain return types (no Prisma types leaked above Layer 4).

### 3. Shared Schemas & Cross-Cutting Utilities (`src/schemas/`, `src/lib/`) _(if applicable — T005)_
- Zod schemas (`tdrs/T005-zod-validation.md`), inferred types, and `src/lib/` utilities.

### 4. Layer 3 — Service (`src/services/`) _(if applicable — T006)_
- Pure TypeScript business rule checks (citing `P###`), `DomainError` codes thrown, and `withTransaction` boundaries (`tdrs/T006-layered-architecture.md`).

### 5. Layer 2 — Actions & Queries (`src/actions/`) _(if applicable — T003, T005, T006)_
- `"use server"` actions (`tdrs/T003-server-actions-for-mutations.md`) and `"server-only"` queries: auth guard → Zod parse (`T005`) → service call → revalidation/redirect or error return.

### 6. Layer 1 — Presentation (`src/app/`, `src/components/`) _(if applicable — T001, T006–T010, P012, P013)_
- Next.js 16 App Router routes (`T001`), Server/Client components (`T006`), `next-intl` RTL/LTR bilingual rules (`T010`, `P013`), and neo-brutalist monochrome Tailwind v4 + `shadcn/ui` alignment (`T007`, `T008`, `T009`, `P012`).

### Architectural & Database Rules to Enforce
- Explicit invariants from `architecture.md`, `database.md`, PRDs (`P###`), and TDRs (`T###`) that the implementation must not violate.

## Acceptance Criteria

- [ ] Concrete, testable criterion 1 (P###, T###)
- [ ] Concrete, testable criterion 2 (P###, T###)

## Open Questions

_None — all requirements are specified in the referenced PRDs, TDRs, architecture, and database docs._

<!-- Or if questions exist / were resolved:
### T###-Q1 — Question title

- **A.** Option A **(Recommended)**
- **B.** Option B

**Recommendation:** Why Option A fits our architecture/database best (and whether any option updates/supersedes a PRD or TDR).

**Answer:** _pending_ (or the user's chosen option)
-->
```

### Step 7: Update `engineering/tasks/README.md`

After writing or updating any task file, update `engineering/tasks/README.md`:
1. Add or update the row in the `## Tasks Index` table with:
   - `ID`: `[T###](T###-short-kebab-title.md)`
   - `One-line description`: A single, self-contained sentence stating what problem the task solves so agents can understand it without opening the file.
   - `Depends on`: Prerequisite `T###` IDs (or `—`).
   - `Status`: `Todo`, `In Progress`, `Done`, or `Blocked`.
   - `Open questions`: `unanswered of total` (e.g., `0 of 0`, `1 of 1`).
2. Update `Next free number: **T###**`.
3. Update the dependency diagram if task dependencies changed.
