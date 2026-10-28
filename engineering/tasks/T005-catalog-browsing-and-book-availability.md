# T005 — Catalog Browsing, Search, and Book Availability Details

| Field | Value |
| --- | --- |
| ID | T005 |
| Status | Done |
| Area | Catalog (Full-stack across all 4 layers) |
| Depends on | [T002](T002-database-schema-and-prisma-setup.md), [T003](T003-i18n-and-design-system-foundation.md), [T004](T004-authentication-and-role-access.md) |
| PRDs | [P002](../../prds/P002-login-and-protected-access.md), [P004](../../prds/P004-catalog-browsing.md), [P005](../../prds/P005-book-availability.md), [P012](../../prds/P012-visual-identity.md), [P013](../../prds/P013-ui-language.md) |
| TDRs | [T003](../../tdrs/T003-server-actions-for-mutations.md), [T004](../../tdrs/T004-prisma-orm.md), [T005](../../tdrs/T005-zod-validation.md), [T006](../../tdrs/T006-layered-architecture.md), [T009](../../tdrs/T009-neo-brutalist-design-system.md), [T010](../../tdrs/T010-next-intl-i18n.md) |
| Open questions | 0 of 0 |

## What

Build the authenticated catalog browsing page (`/books`), case-insensitive partial-match search by book title or author (`?q=...`), and the book details page (`/books/[bookId]`) displaying live copy-based availability derived from non-withdrawn copies and active loans.

## Why

Members need a way to discover books in the library, search by title or author, and inspect whether physical copies are currently available before attempting to borrow (P004, P005). Because book availability in our database design is never stored as a boolean column (`engineering/database.md`), we must implement the canonical derived availability query (`withdrawn_at IS NULL` and no loan with `returned_at IS NULL`) and expose it cleanly through the repository, service, query, and presentation layers before wiring the borrowing transaction in T006.

## How

### 1. Layer 4 — Book & Copy Repositories (`src/repositories/book.repository.ts`, `src/repositories/copy.repository.ts`)

- Implement read queries using Prisma (T004) where availability is **derived, never stored** ([`../database.md`](../database.md), P005):
  - `totalCopies`: count of copies for the book where `withdrawn_at IS NULL`.
  - `availableCopies`: count of copies for the book where `withdrawn_at IS NULL` and there is no loan with `returned_at IS NULL`.
- `findCatalogBooks({ query?: string })`:
  - Returns all books ordered consistently, including books with `0` available copies (P004).
  - When `query` is provided, filters by case-insensitive partial match on `title` or `author` (`contains` / `ILIKE` backed by the `pg_trgm` indexes from T002) (P004-Q1).
- `findBookByIdWithAvailability(bookId: string)`:
  - Returns book fields (`id`, `title`, `author`, `description`, `isbn`, `coverImageUrl`) plus `totalCopies` and `availableCopies`, or `null` if not found.

### 2. Shared Schemas (`src/schemas/catalog.schema.ts`) (T005)

- `catalogSearchSchema`: validates optional `q` search query string (trimmed, max length).
- `bookIdSchema`: validates `bookId` as a UUID.

### 3. Layer 3 — Catalog Service (`src/services/catalog.service.ts`) (T006)

- `listCatalogBooks(params: { query?: string })`:
  - Calls `bookRepository.findCatalogBooks` and computes availability state (`isAvailable: availableCopies > 0`).
- `getBookDetails(bookId: string)`:
  - Calls `bookRepository.findBookByIdWithAvailability(bookId)`.
  - Throws `DomainError("BOOK_NOT_FOUND")` if the book does not exist.
  - Returns the book details along with derived availability (`totalCopies`, `availableCopies`, `isAvailable`).

### 4. Layer 2 — Server-Only Book Queries (`src/actions/book.queries.ts`) (T003, T006)

- Mark file with `import "server-only"` (reads are never `"use server"` endpoints per T003).
- `getCatalogBooksQuery(searchParams)`:
  1. Authenticate session via `requireUser()` (catalog is for logged-in users only, P002).
  2. Validate search input with `catalogSearchSchema` (T005).
  3. Call `catalogService.listCatalogBooks`.
- `getBookDetailsQuery(bookId: string)`:
  1. Authenticate session via `requireUser()` (P002).
  2. Validate `bookId` with `bookIdSchema` (T005).
  3. Call `catalogService.getBookDetails`.

### 5. Layer 1 — Catalog & Book Details UI (`src/components/`, `src/app/[locale]/books/`)

Build the catalog components specified in [`../design-system/components.md`](../design-system/components.md) and [`../design-system/usage.md`](../design-system/usage.md):

- `AvailabilityBadge`:
  - When `availableCopies > 0`: `default` badge (`bg-white border-2 border-black`) with check icon and localized `AVAILABLE · N COPIES` / `متاح · N نسخة` (`font-mono` for `N`) (P005, P012, P013).
  - When `availableCopies === 0`: `muted` badge (`bg-stripes text-gray-600`) with `X` icon and localized `UNAVAILABLE` / `غير متاح` (P005, P012).
- `CatalogSearch`:
  - Search input + inverted search button submitting via URL query param `?q=...` so searches are shareable and preserve locale (`/ar/books?q=...`, `/en/books?q=...`) (P004-Q1, P013).
- `BookCard` & `BookGrid`:
  - Responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`).
  - Square cover area (`border-b-3 border-black`), title wrapped in `<bdi>` (so English titles in Arabic UI and vice versa render cleanly per `usage.md`), author, and `AvailabilityBadge`.
  - Whole card uses the pressable shadow pattern and links to `/[locale]/books/[bookId]`.
  - Unavailable books apply the `bg-stripes` muted treatment (never `opacity-50`) (P012, `usage.md`).
- `BookDetails`:
  - Displays large title (`text-4xl`), author, description, optional ISBN (in `font-mono` and `dir="ltr"`), optional cover image, and `AvailabilityBadge` with available/total copy count (P004, P005).
  - Includes the `BorrowPanel` container showing the book's availability status (ready to wire to the borrow transaction and member eligibility rules in T006).
- Pages:
  - `src/app/[locale]/books/page.tsx`: renders `PageHeader`, `CatalogSearch`, and `BookGrid` (or `EmptyState` when no books match the search query).
  - `src/app/[locale]/books/[bookId]/page.tsx`: renders back link (with `rtl:-scale-x-100` arrow icon), `BookDetails`, and handles `BOOK_NOT_FOUND` via `notFound()`.

### Architectural & Database Rules to Enforce

- Book data (`title`, `author`, `description`) is **never translated**; it is rendered as entered and wrapped in `<bdi>` (`P013`, `usage.md`).
- All UI chrome, labels, empty states, and availability badges are translated via `next-intl` with Western digits (`0–9`) (`P013`, `T010`).
- Pages call only `src/actions/book.queries.ts`, never services or Prisma directly (`T006`).

## Acceptance Criteria

- [x] A logged-in member sees all books in `/[locale]/books`, including books with 0 available copies (P004).
- [x] Unavailable books are visually distinct using `bg-stripes`, an `X` icon, and the localized `UNAVAILABLE` / `غير متاح` badge—without relying on color (P005, P012).
- [x] Searching by a substring of a title or author returns only matching books, and shows `EmptyState` when nothing matches (P004-Q1).
- [x] Opening `/[locale]/books/[bookId]` shows the book's full details (title, author, description, optional ISBN/cover) and the exact count of available copies (P004, P005).
- [x] Both `/ar/books` (RTL) and `/en/books` (LTR) render properly with mirrored layout and un-translated book titles wrapped in `<bdi>` (P013).

## Open Questions

_None — all catalog browsing, search, and copy availability rules are specified in P004, P005, `engineering/database.md`, and `engineering/design-system/`._
