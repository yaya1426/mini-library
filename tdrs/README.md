# Mini Library — TDR Index

TDRs (Technical Decision Records) are the **source of truth** for technical decisions in
the Mini Library project. Business decisions live in [`../prds`](../prds/README.md); TDRs
describe *how* we build what the PRDs require.

## Numbering scheme

- Every TDR is **one independent technical decision** in its own file.
- IDs are `T` + 3 digits: `T001`, `T002`, … `T999`.
- File name: `T###-short-kebab-title.md` (e.g. `T002-postgresql-database.md`).
- New TDRs take the **next free number**. Numbers are never reused or renumbered, even if a
  TDR is rejected or replaced, so references in code, PRs, and commits stay stable.
- Open questions inside a TDR are numbered `T###-Q#` (e.g. `T003-Q1`).
- To change an accepted decision, write a **new** TDR and mark the old one
  `Superseded by T0xx`.
- New TDRs start from [`_template.md`](_template.md).

## Statuses

| Status | Meaning |
| --- | --- |
| Accepted | The decision is final and must be followed. |
| Proposed | Suggested, waiting for a decision. |
| Rejected | Considered and not adopted. Kept for history. |
| Superseded | Replaced by a newer TDR (linked in the file). |

## Index

| ID | Title | Area | Status |
| --- | --- | --- | --- |
| [T001](T001-nextjs-16-framework.md) | Next.js 16 as the application framework | Framework | Accepted |
| [T002](T002-postgresql-database.md) | PostgreSQL as the database | Data | Accepted |
| [T003](T003-server-actions-for-mutations.md) | Full-stack Next.js with Server Actions for mutations | Architecture | Accepted |
| [T004](T004-prisma-orm.md) | Prisma as the ORM | Data | Accepted |
| [T005](T005-zod-validation.md) | Zod for input validation | Validation | Accepted |
| [T006](T006-layered-architecture.md) | Layered architecture | Architecture | Accepted |
| [T007](T007-tailwind-css-v4.md) | Tailwind CSS v4 for styling | UI / Styling | Accepted |
| [T008](T008-shadcn-ui-components.md) | shadcn/ui as the component base | UI / Components | Accepted |
| [T009](T009-neo-brutalist-design-system.md) | Neo-brutalist monochrome design system | UI / Design system | Accepted |
| [T010](T010-next-intl-i18n.md) | next-intl for internationalization | UI / i18n | Accepted |

Next free number: **T011**

## Stack at a glance

```
Next.js 16 (App Router)                          T001
  Presentation   app/ Server Components          T006
                 Tailwind v4 + shadcn/ui          T007, T008, T009
                 next-intl (ar / en)              T010
  Actions        Server Actions + queries, Zod   T003, T005
  Service        business rules                  T006
  Repository     Prisma ORM                      T004
  PostgreSQL                                     T002
```

Full architecture: [`../engineering/architecture.md`](../engineering/architecture.md).

## Change log

| Date | Change |
| --- | --- |
| 2026-10-20 | Initial TDRs T001–T004 recorded |
| 2026-10-20 | Added T005 (Zod) and T006 (layered architecture); T003 reads now go through the actions layer |
| 2026-10-20 | Added T007 (Tailwind CSS v4), T008 (shadcn/ui), T009 (neo-brutalist design system) |
| 2026-10-20 | Added T010 (next-intl) for the bilingual UI decided in P013 |
