# Architecture

This document describes how the Mini Library code is organized. The decisions behind it
are recorded in [T006](../tdrs/T006-layered-architecture.md) (layers),
[T003](../tdrs/T003-server-actions-for-mutations.md) (Server Actions),
[T004](../tdrs/T004-prisma-orm.md) (Prisma), and [T005](../tdrs/T005-zod-validation.md) (Zod).
Business rules come from [`../prds`](../prds/README.md).

## Overview

The application is a single Next.js 16 app (T001) split into **four layers**. Each layer
calls only the layer directly below it.

```
┌──────────────────────────────────────────────────────────┐
│ 1. Presentation   app/ pages, layouts, components        │  renders UI
├──────────────────────────────────────────────────────────┤
│ 2. Actions        Server Actions (writes) + queries      │  auth, Zod validation,
│                   (reads)                                │  revalidation
├──────────────────────────────────────────────────────────┤
│ 3. Service        business rules from the PRDs           │  "can this member
│                                                          │   borrow this book?"
├──────────────────────────────────────────────────────────┤
│ 4. Repository     Prisma, the only code that talks       │  data access
│                   to PostgreSQL                          │
└──────────────────────────────────────────────────────────┘
                         PostgreSQL
```

Request flow:

```
Page / Form  →  Action  →  Service  →  Repository  →  PostgreSQL
```

## Dependency rules

1. A layer may import only from the layer **directly below** it, plus shared modules
   (`schemas/`, `lib/`).
2. **No skipping layers.** A page never calls a service; an action never calls a
   repository.
3. **No upward imports.** A service never imports from `actions/` or `app/`; a repository
   never imports from `services/`.
4. Only `repositories/` imports the Prisma client.
5. Only `app/` and `components/` contain JSX.

| Layer | May call | Must not contain |
| --- | --- | --- |
| Presentation | Actions | Business rules, Prisma, direct service calls |
| Actions | Services, Zod schemas, session helper | Business rules, Prisma |
| Service | Repositories | Next.js APIs (`revalidatePath`, `cookies`, `redirect`), Prisma, JSX |
| Repository | Prisma client | Business rules, Next.js APIs |

## Folder structure

```
mini-library/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── messages/                    # UI translations (T010)
│   ├── ar.json
│   └── en.json
└── src/
    ├── app/                     # 1. Presentation: routes (App Router)
    │   ├── globals.css          #    design tokens (T007)
    │   └── [locale]/            #    /ar/… and /en/… (P013, T010)
    │       ├── layout.tsx       #    sets <html lang dir>
    │       ├── (auth)/login/page.tsx
    │       ├── (auth)/signup/page.tsx
    │       ├── books/page.tsx
    │       ├── books/[bookId]/page.tsx
    │       ├── loans/page.tsx
    │       └── admin/...
    ├── i18n/                    # next-intl routing and request config (T010)
    ├── components/              # 1. Presentation: app components (BookCard, …)
    │   └── ui/                  #    shadcn/ui base components (T008)
    ├── actions/                 # 2. Actions
    │   ├── auth.actions.ts      #    "use server"  → mutations
    │   ├── loan.actions.ts
    │   ├── book.queries.ts      #    "server-only" → reads
    │   └── loan.queries.ts
    ├── services/                # 3. Service (business layer)
    │   ├── auth.service.ts
    │   ├── catalog.service.ts
    │   ├── loan.service.ts
    │   └── fine.service.ts
    ├── repositories/            # 4. Repository (data layer)
    │   ├── db.ts                #    the single Prisma client instance
    │   ├── user.repository.ts
    │   ├── book.repository.ts
    │   ├── copy.repository.ts
    │   ├── loan.repository.ts
    │   └── fine.repository.ts
    ├── schemas/                 # Zod schemas (shared by actions and forms)
    │   ├── auth.schema.ts
    │   └── loan.schema.ts
    └── lib/                     # cross-cutting helpers
        ├── session.ts           #    read the current user
        ├── errors.ts            #    DomainError
        └── dates.ts             #    Cairo-time day math (P007, P009)
```

## Layer 1 — Presentation (`app/`, `components/`)

Next.js pages, layouts, and components.

- Pages are **Server Components**. They get data by calling **query functions** from the
  actions layer, then render it.
- Forms submit to **Server Actions** from the actions layer.
- Client components (`"use client"`) are used only for interactivity: pending states,
  showing action errors, confirm dialogs.
- No business decisions here. The page doesn't compute "can borrow"; it renders what the
  query returns (e.g. `canBorrow: false, reason: "LOAN_LIMIT_REACHED"`).
- Styling follows the [design system](design-system/README.md): Tailwind CSS v4 (T007),
  shadcn/ui (T008), neo-brutalist monochrome (T009).

## Layer 2 — Actions (`actions/`)

The boundary between the web and the business. It has two kinds of files:

| File | Marker | Used for | Called from |
| --- | --- | --- | --- |
| `*.actions.ts` | `"use server"` | Mutations: sign up, borrow, return, pay fine… | Forms / client components |
| `*.queries.ts` | `import "server-only"` | Reads: list books, book details, my loans… | Server Components |

Reads are not Server Actions on purpose: every `"use server"` export becomes a public
HTTP endpoint, and reads don't need one. `server-only` keeps them callable only on the
server.

Every action and query does, in this order:

1. **Authenticate**: read the session; reject if not logged in (P002).
2. **Validate**: parse input with a Zod schema from `schemas/` (T005).
3. **Call one service function**, passing the validated input and the current user.
4. **Map the result** for the UI: on success, `revalidatePath` / `redirect`; on a
   `DomainError`, return `{ ok: false, error }` so the form can show the message.

Actions contain no business rules.

## Layer 3 — Service (`services/`)

All business rules from the PRDs live here and only here. For example:

- `loan.service.ts`: borrow eligibility and borrowing (P005, P006, P010), due date
  (P007), return (P008).
- `fine.service.ts`: fine calculation (P009) and settlement (P010).
- Role checks that are business rules, e.g. only a librarian can record a return (P003, P008).

Rules:

- Plain TypeScript functions, with no Next.js imports and no Prisma imports. This keeps the
  business logic testable with fake repositories.
- Inputs are already validated and typed (by Zod, in the actions layer). The service
  checks **business rules**, not input format.
- Business rule violations throw a `DomainError` with a stable code
  (e.g. `LOAN_LIMIT_REACHED`, `HAS_OVERDUE_LOANS`, `HAS_UNPAID_FINES`).
- Multi-step writes run in a transaction through the repository layer's
  `withTransaction` helper, so the 3-book limit check and the loan creation happen
  atomically (P005, P006).

## Layer 4 — Repository (`repositories/`)

The only code that talks to the database.

- One repository per aggregate: users, books, copies, loans, fines.
- `db.ts` holds the single Prisma client instance (T004); nothing outside
  `repositories/` imports it.
- Functions are small and named for what they fetch or change:
  `countActiveLoans(userId)`, `findAvailableCopy(bookId)`, `createLoan(...)`.
- No business rules. "Has fewer than 3 loans" is a service decision; the repository only
  returns the count.
- Every function accepts an optional transaction handle so services can group several
  repository calls into one transaction.
- Returns plain domain types, so Prisma-specific types don't leak into services.

## Validation (Zod)

Validation happens in two places, with different jobs:

| Where | What | Example |
| --- | --- | --- |
| Zod in the actions layer | **Shape and format** of input | Email is valid, password ≥ 8 chars, `bookId` is a valid ID |
| Service layer | **Business rules** | Member has fewer than 3 active loans, no unpaid fines |

- Schemas live in `schemas/` and are shared by actions (server validation) and forms
  (optional client-side hints). The server-side parse is the one that counts.
- Types for validated input are inferred from the schema (`z.infer`), not written by hand.
- Validation errors are returned to the form per field.

## Errors

| Kind | Raised by | Handled by | Shown to user |
| --- | --- | --- | --- |
| Validation error | Zod in actions | Action returns field errors | Next to the form field |
| `DomainError` | Service | Action returns `{ ok: false, error }` with the error **code** | The presentation layer translates the code (`errors.LOAN_LIMIT_REACHED`) into Arabic or English (T010) |
| Unexpected error | Anywhere | Next.js error boundary | Generic error page |

## Example: borrowing a book

```
books/[bookId]/page.tsx        Presentation
   │  form submit
   ▼
loan.actions.ts › borrowBook    Actions
   │  1. session → current user (else redirect to /login)
   │  2. borrowBookSchema.parse({ bookId })
   │  3. loanService.borrow(user, bookId)
   ▼
loan.service.ts › borrow        Service — inside withTransaction:
   │  - member has no overdue loans?              P006-Q2
   │  - member has no unpaid fines?               P010-Q2
   │  - member has < 3 active loans?              P006
   │  - member doesn't already hold this book?    P006-Q1
   │  - an available copy exists?                 P005
   │  - create loan, due = today + 14 days        P007
   ▼
loan.repository.ts / copy.repository.ts / fine.repository.ts
   │  Prisma queries
   ▼
PostgreSQL                      unique "one active loan per copy" (T002)
```

On success the action revalidates the book page and "My loans". On a `DomainError` it
returns the error code and the page shows the matching message.
