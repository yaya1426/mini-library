# T### — Title

| Field | Value |
| --- | --- |
| ID | T### |
| Status | Todo |
| Area | Foundation / Data / Presentation / Auth / Catalog / Borrowing / Returns / Fines / … |
| Depends on | None |
| PRDs | [P###](../../prds/P###-slug.md) |
| TDRs | [T###](../../tdrs/T###-slug.md) |
| Open questions | 0 of 0 |

## What

What single problem, business case, or bug this task solves, and what concrete outcome it delivers.

## Why

Why this is a problem and why we are introducing this task now (business need, architectural dependency, or risk/bug prevented).

## How

Concrete technical steps to solve the problem, following [`../architecture.md`](../architecture.md) and [`../database.md`](../database.md) (with zero assumptions):

### 1. Database & Schema (`prisma/`) _(omit if no DB changes)_

- …

### 2. Layer 4 — Repository (`src/repositories/`) _(omit if not applicable)_

- …

### 3. Shared Schemas & Utilities (`src/schemas/`, `src/lib/`) _(omit if not applicable)_

- …

### 4. Layer 3 — Service (`src/services/`) _(omit if not applicable)_

- …

### 5. Layer 2 — Actions & Queries (`src/actions/`) _(omit if not applicable)_

- …

### 6. Layer 1 — Presentation (`src/app/`, `src/components/`) _(omit if not applicable)_

- …

### Architectural & Database Rules to Enforce

- …

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Open Questions

_None._

<!-- When open questions exist (or have been answered), record each one as:

### T###-Q1 — Question

- **A.** Option **(Recommended)**
- **B.** Option

**Recommendation:** why.

**Answer:** _pending_
-->
