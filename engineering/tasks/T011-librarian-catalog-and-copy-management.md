# T011 — Librarian Catalog and Copy Management

| Field | Value |
| --- | --- |
| ID | T011 |
| Status | Todo |
| Area | Librarian Catalog & Copies (Full-stack across all 4 layers) |
| Depends on | [T002](T002-database-schema-and-prisma-setup.md), [T004](T004-authentication-and-role-access.md), [T005](T005-catalog-browsing-and-book-availability.md), [T010](T010-librarian-returns-and-fine-settlement-ui.md) |
| PRDs | [P003](../../prds/P003-librarian-role.md), [P004](../../prds/P004-catalog-browsing.md), [P005](../../prds/P005-book-availability.md), [P012](../../prds/P012-visual-identity.md), [P013](../../prds/P013-ui-language.md) |
| TDRs | [T002](../../tdrs/T002-postgresql-database.md), [T003](../../tdrs/T003-server-actions-for-mutations.md), [T004](../../tdrs/T004-prisma-orm.md), [T005](../../tdrs/T005-zod-validation.md), [T006](../../tdrs/T006-layered-architecture.md), [T008](../../tdrs/T008-shadcn-ui-components.md), [T009](../../tdrs/T009-neo-brutalist-design-system.md), [T010](../../tdrs/T010-next-intl-i18n.md) |
| Open questions | 0 of 2 |

## What

Deliver end-to-end librarian catalog and physical copy management across all four architecture layers: adding and editing books (`BookForm`), adding physical copies with auto-generated or custom barcodes, withdrawing individual copies from circulation (`withdrawn_at`, `CopyList`), and safely deleting books that have zero loan history (or withdrawing all copies when loan history exists) (P003, P004, P005, [`../database.md`](../database.md)).

## Why

PRD `P003` requires that a librarian can *"Add, edit, and remove books, and set the number of copies"*, while `P005` and [`../database.md`](../database.md) require that every book has physical copies in `copies` (`withdrawn_at` used to retire copies without deleting loan history under `ON DELETE RESTRICT`). Without this capability, the catalog is frozen to what was seeded in `T002`, and librarians cannot add new titles, add copies for popular books, or withdraw lost/damaged copies.

## How

### 1. Layer 4 — Book & Copy Repository Extensions (`src/repositories/book.repository.ts`, `src/repositories/copy.repository.ts`) (T004, T006)

- **`src/repositories/book.repository.ts`**:
  - `createBook(data: { title: string; author: string; description: string; isbn: string | null; coverImageUrl: string | null }, tx?: DbClient)`: inserts a row in `books`, mapping unique `isbn` violations (`P2002`) to `DomainError("ISBN_ALREADY_IN_USE")`.
  - `updateBook(bookId: string, data: { title: string; author: string; description: string; isbn: string | null; coverImageUrl: string | null }, tx?: DbClient)`: updates book metadata, mapping missing rows to `BOOK_NOT_FOUND` and duplicate `isbn` to `ISBN_ALREADY_IN_USE`.
  - `countLoansByBookId(bookId: string, tx?: DbClient)`: counts total loans (active or returned) referencing `bookId`.
  - `deleteBookWithCopies(bookId: string, tx: DbClient)`: deletes all copies of `bookId` and the `books` row when `countLoansByBookId === 0` (`ON DELETE RESTRICT` safety, `database.md`).
  - `findAllBooksWithCopiesForLibrarian(tx?: DbClient)`: returns all books with their copies (`id`, `barcode`, `withdrawnAt`, `createdAt`, and whether the copy is currently on an active loan `returnedAt IS NULL`) and total loan count.
- **`src/repositories/copy.repository.ts`**:
  - `createCopies(bookId: string, barcodes: string[], tx?: DbClient)`: inserts one or more physical copies for `bookId`, mapping unique `barcode` violations (`P2002`) to `DomainError("BARCODE_ALREADY_IN_USE")`.
  - `findCopyByIdWithActiveLoan(copyId: string, tx?: DbClient)`: returns copy details plus whether it has an active loan (`returnedAt IS NULL`).
  - `withdrawCopy(copyId: string, withdrawnAt: Date, tx?: DbClient)`: sets `withdrawn_at = withdrawnAt` where `id = copyId AND withdrawn_at IS NULL`.
  - `withdrawAllActiveCopiesForBook(bookId: string, withdrawnAt: Date, tx?: DbClient)`: sets `withdrawn_at = withdrawnAt` on all non-withdrawn copies of `bookId` that have no active loan.

### 2. Shared Schemas & Domain Error Codes (`src/lib/errors.ts`, `src/schemas/catalog.schema.ts`) (T005)

- Extend `DOMAIN_ERROR_CODES` in `src/lib/errors.ts` (and add matching translations in `messages/ar.json` and `messages/en.json`):
  - `ISBN_ALREADY_IN_USE`, `BARCODE_ALREADY_IN_USE`, `COPY_NOT_FOUND`, `COPY_ALREADY_WITHDRAWN`, `COPY_ON_ACTIVE_LOAN`, `BOOK_HAS_ACTIVE_LOANS`, `BOOK_HAS_LOAN_HISTORY`.
- In `src/schemas/catalog.schema.ts`:
  - `createBookSchema`: `title` (trimmed non-empty), `author` (trimmed non-empty), `description` (trimmed string, default `""`), `isbn` (optional/nullable trimmed string), `coverImageUrl` (optional/nullable valid URL), `initialCopiesCount` (integer `1..50`, default `1`, P005: a book has at least 1 copy).
  - `updateBookSchema`: `bookId` (UUID) + `title`, `author`, `description`, `isbn`, `coverImageUrl`.
  - `addCopiesSchema`: `bookId` (UUID), `count` (integer `1..50`, default `1`), optional `customBarcode` (trimmed non-empty string when adding 1 copy).
  - `withdrawCopySchema`: `copyId` (UUID).
  - `removeBookSchema`: `bookId` (UUID).

### 3. Layer 3 — Catalog Service Extensions (`src/services/catalog.service.ts`) (T006)

- Enforce `actor.role === "LIBRARIAN"` (`FORBIDDEN`) on all librarian catalog mutations and queries (P003):
  - `createBookWithCopies(actor: SessionUser, input: CreateBookInput)`:
    - Runs inside `withTransaction`: creates the `books` record and generates `initialCopiesCount` unique barcodes (e.g. `ML-<shortBookCode>-<seq>`) to insert into `copies` (P003, P005, T011-Q2).
  - `updateBookDetails(actor: SessionUser, input: UpdateBookInput)`:
    - Updates the book's metadata (`title`, `author`, `description`, `isbn`, `coverImageUrl`).
  - `addBookCopies(actor: SessionUser, input: AddCopiesInput)`:
    - Verifies book exists (`BOOK_NOT_FOUND`), then inserts `count` new copies with either the provided `customBarcode` or auto-generated unique barcodes (T011-Q2).
  - `withdrawBookCopy(actor: SessionUser, copyId: string)`:
    - Verifies copy exists (`COPY_NOT_FOUND`), is not already withdrawn (`COPY_ALREADY_WITHDRAWN`), and is not currently on an active loan (`COPY_ON_ACTIVE_LOAN`, must be returned first), then sets `withdrawn_at = new Date()` (`database.md`).
  - `removeBook(actor: SessionUser, bookId: string)` (T011-Q1):
    - Runs inside `withTransaction`:
    - Verifies book exists (`BOOK_NOT_FOUND`).
    - If any copy of the book is currently on an active loan (`returnedAt IS NULL`), throws `DomainError("BOOK_HAS_ACTIVE_LOANS")`.
    - If `countLoansByBookId(bookId, tx) === 0`, permanently deletes the book and its copies (`deleteBookWithCopies`).
    - If the book has past loan history (`countLoansByBookId > 0`), withdraws all remaining copies (`withdrawAllActiveCopiesForBook`) so history is preserved per `database.md` (`ON DELETE RESTRICT`) while making the book unavailable for future borrowing.
  - `listBooksForLibrarian(actor: SessionUser)`:
    - Returns all books with copy details, active loan flags, and loan history counts.

### 4. Layer 2 — Librarian Catalog Server Actions & Queries (`src/actions/book.actions.ts`, `src/actions/book.queries.ts`) (T003, T005, T006)

- **`src/actions/book.actions.ts` (`"use server"`)**:
  - `createBookAction`, `updateBookAction`, `addCopiesAction`, `withdrawCopyAction`, `removeBookAction`:
    1. Authenticate with `requireLibrarian()` (P003).
    2. Validate input with the corresponding Zod schema (T005).
    3. Call `catalogService.*`.
    4. Revalidate `/[locale]/books`, `/[locale]/books/[bookId]`, and `/[locale]/admin`.
    5. Catch `DomainError` and return `{ ok: false, error: err.code }`.
- **`src/actions/book.queries.ts` (`import "server-only"`)**:
  - `getBooksForLibrarianQuery()`: calls `requireLibrarian()` → `catalogService.listBooksForLibrarian`.

### 5. Layer 1 — Librarian Catalog UI (`src/components/`, `src/app/[locale]/admin/page.tsx`)

Build the librarian catalog components from [`../design-system/components.md`](../design-system/components.md):

- **`BookForm` (`src/components/book-form.tsx`)**:
  - Dialog/form for adding a new book (with initial copy count) or editing an existing book (`title`, `author`, `description`, `isbn`, `coverImageUrl`).
- **`CopyList` (`src/components/copy-list.tsx`)**:
  - Displays a book's physical copies with `font-mono` `dir="ltr"` barcode, status badge (`AVAILABLE`, `ON LOAN`, or `WITHDRAWN` with `bg-stripes`), form to add copies (auto-generated or custom barcode), and **Withdraw** action (`variant="destructive"`) on available non-withdrawn copies (`components.md`).
  - Includes the **Remove / Withdraw Book** action (`delete` when 0 loans, or `withdraw all copies` when loan history exists).
- Integrate the **Books & Copies** tab into `src/app/[locale]/admin/page.tsx` (`Tabs`).

### Architectural & Database Rules to Enforce

- Only `LIBRARIAN` users can create, edit, remove books, or add/withdraw copies (P003).
- No book or copy with loan history is ever hard-deleted (`ON DELETE RESTRICT` in `database.md`); copies are withdrawn via `withdrawn_at` instead (T011-Q1).
- Withdrawn copies (`withdrawn_at IS NOT NULL`) never count toward `totalCopies` or `availableCopies` when members browse or borrow (P005, `database.md`).

## Acceptance Criteria

- [ ] A `LIBRARIAN` can add a new book with `N` initial copies, and the book immediately appears in `/[locale]/books` with `N` available copies (P003, P004, P005).
- [ ] A `LIBRARIAN` can edit a book's title, author, description, ISBN, and cover URL (P003).
- [ ] A `LIBRARIAN` can add new copies (with auto-generated or custom barcodes) to an existing book, increasing its `availableCopies` (P003, P005).
- [ ] A `LIBRARIAN` can withdraw an available copy (`withdrawn_at` set), which styles the copy with `bg-stripes` in `CopyList` and reduces `availableCopies` by 1 without deleting past loan records (P003, P005, `database.md`).
- [ ] Attempting to withdraw a copy that is currently on an active loan fails with `COPY_ON_ACTIVE_LOAN` (P005, P008).
- [ ] Removing a book with zero loan history deletes the book; removing a book with past loan history withdraws all its copies while preserving loan/fine history (P003, `database.md`, T011-Q1).
- [ ] A `MEMBER` calling any book/copy mutation action receives `FORBIDDEN` (P003).

## Open Questions

### T011-Q1 — How should book removal (`P003`) interact with `ON DELETE RESTRICT` and loan history (`database.md`)?

- **A.** Allow withdrawing individual copies (`withdrawn_at`) always, and allow deleting a book if it has zero loans (otherwise withdraw all its active copies to preserve history) **(Recommended)**
- **B.** Never delete `books` rows; only withdraw copies

**Recommendation:** A satisfies both `P003` ("remove books") for newly created/unused books and `database.md` ("Nothing is hard-deleted once it has history").

**Answer:** A — Allow withdrawing copies (`withdrawn_at`) always, and allow deleting a book if it has zero loans (otherwise withdraw all its copies).

### T011-Q2 — How should barcodes (`copies.barcode`) be assigned when a librarian adds copies to a book?

- **A.** Support adding `N` copies with auto-generated unique barcodes, plus an optional custom barcode when adding a single copy **(Recommended)**
- **B.** Require manual barcode entry for every single copy

**Recommendation:** A makes setting copy counts fast while still supporting pre-labeled physical books.

**Answer:** A — Auto-generated unique barcodes with optional custom barcode support.
