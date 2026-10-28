# T003 — Internationalization (`next-intl`) and Neo-Brutalist Design System Foundation

| Field | Value |
| --- | --- |
| ID | T003 |
| Status | Done |
| Area | Presentation / UI & i18n |
| Depends on | [T001](T001-project-scaffolding-and-core-architecture.md) |
| PRDs | [P012](../../prds/P012-visual-identity.md), [P013](../../prds/P013-ui-language.md) |
| TDRs | [T007](../../tdrs/T007-tailwind-css-v4.md), [T008](../../tdrs/T008-shadcn-ui-components.md), [T009](../../tdrs/T009-neo-brutalist-design-system.md), [T010](../../tdrs/T010-next-intl-i18n.md) |
| Open questions | 0 of 0 |

## What

Implement the bilingual Arabic (`ar`, RTL default) and English (`en`, LTR) routing and translation foundation with `next-intl`, and build the neo-brutalist monochrome design tokens, restyled `shadcn/ui` primitives, and shared layout/form components specified in [`../design-system/`](../design-system/README.md).

## Why

Every screen in Mini Library must work seamlessly in both Arabic (RTL, default) and English (LTR) (P013) while strictly adhering to a pure black-and-white neo-brutalist visual identity where status is communicated through borders, patterns, and icons rather than color (P012). Building the locale routing, message dictionaries, design tokens, and shared UI primitives (`Button`, `Input`, `Card`, `Badge`, `Alert`, `AppHeader`, `LanguageSwitcher`, `FormField`) before feature pages prevents hardcoded strings, broken RTL layouts, or off-palette styles in authentication, catalog, and loan screens.

## How

### 1. Cross-cutting & Routing — `next-intl` configuration (`src/i18n/`, `messages/`) (P013, T010)

- Configure supported locales: `ar` (default) and `en` in `src/i18n/routing.ts` and `src/i18n/request.ts`.
- Set up Next.js 16 request proxy (`src/proxy.ts` / middleware per `next-intl` Next.js 16 docs) so `/` redirects to `/ar/...`, locale prefixes (`/ar/...`, `/en/...`) are enforced, and the user's selected locale is persisted across visits (P013).
- Create `messages/ar.json` and `messages/en.json` with matching keys organized by section: `common`, `nav`, `auth`, `catalog`, `loans`, `fines`, `librarian`, and `errors` (mapping every `DomainError` code from T001 to its localized message in P001–P011).
- Configure locale-aware formatting helpers for:
  - **Money:** `25 ج.م` in Arabic and `25 EGP` in English using Western digits (`0–9`, `latn`) (P009, P013).
  - **Dates:** `30 أكتوبر` in Arabic and `Oct 30` in English with Western digits (P013).

### 2. Layer 1 — Design tokens & typography (`src/app/globals.css`, `src/app/[locale]/layout.tsx`) (T007, T009)

- Load `Space Grotesk`, `IBM Plex Sans Arabic` (weights `500`, `700`, `arabic` subset), and `Space Mono` via `next/font/google` in `src/app/[locale]/layout.tsx`, exposing `--font-space-grotesk`, `--font-plex-arabic`, and `--font-space-mono` (`tokens.md`).
- Set `<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>` on the root locale layout.
- Replace `src/app/globals.css` with the exact token specification from [`../design-system/tokens.md`](../design-system/tokens.md):
  - Reset default Tailwind colors (`--color-*: initial`), radii (`--radius-*: initial`), and shadows (`--shadow-*: initial`).
  - Define only `--color-black`, `--color-white`, and `--color-gray-50` through `--color-gray-900`.
  - Define hard offset shadows (`--shadow-xs` `2px`, `--shadow-sm` `4px`, `--shadow-md` `6px`, `--shadow-lg` `8px`).
  - Define `--ease-snap` and the `@utility bg-stripes` pattern.
  - Define base styles (`border-border`, `:focus-visible` 3px black outline, `ltr:tracking-tight` on headings).

### 3. Layer 1 — Restyled `shadcn/ui` base components (`src/components/ui/`) (T008, T009)

Initialize `shadcn/ui` (`npx shadcn@latest init`) and add/restyle the core primitives according to [`../design-system/components.md`](../design-system/components.md) and [`../design-system/usage.md`](../design-system/usage.md):

- `button`: variants (`default` inverted, `secondary`, `destructive`, `ghost`, `link`), sizes (`sm` 36px, `default` 48px, `lg` 56px, `icon` 48×48), `border-3 border-black`, pressable shadow motion, `font-bold ltr:uppercase ltr:tracking-wide`.
- `input` & `textarea`: white background, `border-3 border-black`, `h-12`, `shadow-xs`, square corners, `border-4` on error.
- `label`: `text-xs font-bold ltr:uppercase ltr:tracking-wider` (no letter-spacing in Arabic).
- `card`: `bg-white border-3 border-black shadow-sm`, header separated by `border-b-3`.
- `badge`: `border-2 shadow-xs`, variants (`default`, `muted` with `bg-stripes`, `warning` with `border-dashed`, `inverted` with `bg-black text-white`).
- `alert`: `default` (white, `border-3 border-dashed border-black`) and `destructive` (inverted `bg-black text-white border-3 border-black`).
- `dialog`, `table`, `separator`, `skeleton` (`bg-stripes`, no pulse), `dropdown-menu`.

### 4. Layer 1 — Shared layout & form app components (`src/components/`)

Build the reusable layout and form components from [`../design-system/components.md`](../design-system/components.md):

- `LanguageSwitcher`: two square segments `ع` / `EN` with active locale inverted; preserves current route and query parameters when switching language (P013).
- `AppHeader`: bold logo wordmark, navigation links (`Catalog`, `My loans`, and `Librarian` when role is `LIBRARIAN`), `LanguageSwitcher`, and user menu (`border-b-4 border-black`).
- `PageHeader`: page title (`text-4xl font-bold`), optional subtitle and primary action slot.
- `EmptyState`: dashed `border-3 border-dashed border-black` panel with icon, message, and optional action.
- `FormField`: accessible composition of `Label`, `Input`, and field-level error message with alert icon.

### Architectural & Database Rules to Enforce

- Zero off-palette colors (`bg-blue-500`, `text-red-500`, etc. must not exist or produce styles) (P012, T007).
- Use logical CSS utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) everywhere so RTL and LTR mirror cleanly (P013, `usage.md`).
- Never apply `tracking-*` or `uppercase` without the `ltr:` prefix (`tokens.md`).
- No hard-coded UI strings in components; all text is read via `next-intl` (T010).

## Acceptance Criteria

- [x] Visiting `/` redirects to `/ar` with `<html lang="ar" dir="rtl">`.
- [x] Clicking `LanguageSwitcher` toggles between `/ar/...` and `/en/...`, flipping layout direction (`rtl` ↔ `ltr`) and remembering the choice on subsequent visits.
- [x] All `messages/ar.json` and `messages/en.json` keys match 1-to-1.
- [x] `Button`, `Input`, `Card`, `Badge`, and `Alert` match the neo-brutalist monochrome spec (square corners, 3px black borders, hard offset shadows, no non-gray colors).
- [x] Arabic text renders in `IBM Plex Sans Arabic` without broken letter joins (`tracking` is only applied in `ltr:`), while numbers and English text render in `Space Grotesk` / `Space Mono` using Western digits (`0–9`).

## Open Questions

_None — all design tokens, components, and i18n rules are specified in P012, P013, T007–T010, and `engineering/design-system/`._
