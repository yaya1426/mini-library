# Components

Two kinds of components (T008):

| Kind | Location | Source | Example |
| --- | --- | --- | --- |
| **Base (ui)** | `src/components/ui/` | Added with `npx shadcn@latest add …`, then restyled | `Button`, `Input`, `Dialog` |
| **App** | `src/components/` | Written by us, built from base components | `BookCard`, `AvailabilityBadge` |

Both are presentation layer only ([architecture](../architecture.md)): they render props
and submit forms to Server Actions; they never call services or repositories. All their
text comes from the messages files (T010), and every component must look right in both
RTL (Arabic) and LTR (English).

## Base components (shadcn/ui)

Add only what is used. Each one is restyled once in its `ui/` file using the patterns in
[usage.md](usage.md).

| Component | Used for | Brutalist customization |
| --- | --- | --- |
| `button` | All actions | Variants below; square, `border-3`, pressable |
| `input` | Text, email, password, search | White, `border-3 border-black`, `h-12`, `shadow-xs`, no radius |
| `label` | Form labels | Label pattern (bold, xs; uppercase in English only) |
| `textarea` | Book description (librarian) | Same as `input` |
| `card` | Book cards, panels, summaries | Surface pattern; header separated by `border-b-3` |
| `badge` | Statuses | `border-2`, `shadow-xs`, label text; variants below |
| `alert` | Borrow blocked, form-level errors, notices | `default` = white/dashed; `destructive` = inverted |
| `dialog` | Confirm borrow, record return, mark fine paid | `border-4 shadow-lg`, title bar with `border-b-3`, no fade-scale, quick snap |
| `table` | My loans, librarian lists | `border-3` outer, `border-2` cells, header `bg-black text-white` labels |
| `separator` | Dividing sections | 3px black line |
| `skeleton` | Loading placeholders | `bg-stripes`, no pulse animation |
| `sonner` (toast) | "Book borrowed", "Fine marked as paid" | Inverted, `border-3 shadow-sm`, bottom-end |
| `dropdown-menu` | User menu (log out) | `border-3 shadow-md`, items invert on hover |
| `tabs` | Librarian: loans / fines / books | Active tab inverted |
| `pagination` | Catalog pages | Square pressable page buttons; current page inverted |

### Button variants

| Variant | Look | Use |
| --- | --- | --- |
| `default` | Inverted: `bg-black text-white`, pressable | The primary action (Borrow, Sign up, Log in) |
| `secondary` | `bg-white text-black`, pressable | Secondary actions (Cancel, Back) |
| `destructive` | Inverted + alert icon, pressable | Irreversible librarian actions (withdraw a copy) |
| `ghost` | No border/shadow; `hover:bg-gray-100` | Toolbar and menu actions |
| `link` | Black, bold, `underline underline-offset-4 decoration-2` | Inline navigation |

| Size | Height | Use |
| --- | --- | --- |
| `sm` | 36px | Tables, dense rows |
| `default` | 48px | Most buttons |
| `lg` | 56px | Hero / page primary action |
| `icon` | 48×48 | Icon-only, requires `aria-label` |

All buttons: `font-bold ltr:uppercase ltr:tracking-wide` (no letter-spacing on Arabic,
see [tokens](tokens.md)).

### Badge variants

| Variant | Look | Status |
| --- | --- | --- |
| `default` | White, black border | Available, On loan, Paid |
| `muted` | Stripes, gray-600 text | Unavailable |
| `warning` | Dashed border | Due soon |
| `inverted` | Black, white text | Overdue, Unpaid fine |

## App components

Grouped by screen. Each lists the business rules it displays.

### Layout

| Component | Purpose |
| --- | --- |
| `AppHeader` | Logo wordmark (bold), nav (Catalog, My loans), `LanguageSwitcher`, user menu. `border-b-4`. Shows a librarian link for `LIBRARIAN` (P003). |
| `LanguageSwitcher` | Two square segments `ع` / `EN`; the current one is inverted. Switches locale and keeps the current page (P013, T010). Also shown on login and sign-up pages. |
| `PageHeader` | Page title (`text-4xl`), optional subtitle and action. |
| `EmptyState` | Dashed box with icon, message, optional action (e.g. "No loans yet"). |

### Auth (P001, P002)

| Component | Purpose |
| --- | --- |
| `SignUpForm` | Full name, email, password (P001-Q1); posts to the sign-up action; per-field Zod errors (T005). |
| `LoginForm` | Email, password; shows the generic "Invalid email or password" (P002). |
| `FormField` | Label + input + error message, used by all forms. |

### Catalog (P004, P005)

| Component | Purpose |
| --- | --- |
| `CatalogSearch` | Search by title or author (P004-Q1). Input + inverted search button. |
| `BookGrid` | Responsive grid of `BookCard`. |
| `BookCard` | Cover (square, `border-b-3`), title, author, `AvailabilityBadge`. Whole card is pressable and links to the book page. Unavailable books get the stripes treatment. |
| `AvailabilityBadge` | `AVAILABLE · N COPIES` or `UNAVAILABLE` (P005). |
| `BookDetails` | Large title, author, description, ISBN, availability. |
| `BorrowPanel` | Either the **Borrow** button (primary, `lg`) or an inverted `Alert` with the reason borrowing is blocked: unavailable (P005), 3-book limit (P006), already borrowed (P006-Q1), overdue loans (P006-Q2), unpaid fines (P010-Q2). Borrow confirms in a `Dialog` showing the due date (P007). |

### Member loans (P006, P007, P009, P010, P011)

| Component | Purpose |
| --- | --- |
| `LoanSummary` | Big mono counter `2 / 3` books borrowed (P006) and outstanding fines total (P010). Total fines > 0 is inverted. |
| `LoanList` | The member's active loans as cards (mobile) / table (desktop). |
| `DueStatus` | `DUE OCT 30`, `DUE IN 2 DAYS` (dashed, P011), or `OVERDUE · 3 DAYS` (inverted, P006-Q2). |
| `FineAmount` | Money in `font-mono`, `25 ج.م` / `25 EGP` via the locale formatter; running fine for unreturned overdue books (P009, P013). |
| `FineList` | Past fines with `UNPAID` (inverted) / `PAID` badges (P010). |
| `DueSoonBanner` | Dashed alert at the top of the page when any loan is due within 2 days or overdue (P011). |

### Librarian (P003, P008, P010)

| Component | Purpose |
| --- | --- |
| `BookForm` | Add / edit a book: title, author, description, ISBN, cover URL. |
| `CopyList` | A book's copies with barcode and status; withdraw action (`destructive`). |
| `ActiveLoansTable` | All active loans; overdue rows inverted; **Record return** action. |
| `RecordReturnDialog` | Confirms a return and shows the resulting fine, if any (P008, P009). |
| `UnpaidFinesTable` | Unpaid fines by member; **Mark as paid** action. |
| `MarkFinePaidDialog` | Confirms the amount received in person (P010-Q1). |
| `ResetPasswordDialog` | Librarian sets a temporary password for a member (P002-Q1). |

## Adding a new component

1. Check this list and [usage.md](usage.md); reuse before creating.
2. Base component missing? `npx shadcn@latest add <name>`, restyle it in `ui/`, and add a
   row to the base table.
3. App component? Build it from `ui/` components in `src/components/`, and add a row
   under its screen with the PRDs it implements.
4. New token needed? Add it to `globals.css` **and** [tokens.md](tokens.md) in the same
   change.
