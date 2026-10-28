# T010 — next-intl for Internationalization

| Field | Value |
| --- | --- |
| ID | T010 |
| Status | Accepted |
| Area | UI / i18n |
| Date | 2026-10-20 |
| Related | T001, T003, T006, T009, P013 |

## Context

The UI must support Arabic (RTL, default) and English (LTR) with a switcher, and the
language must be part of the URL (P013). Server Components, Server Actions, and client
components all need translated text.

## Decision

Use **next-intl** (latest version compatible with Next.js 16) for translations, locale
routing, and locale-aware formatting.

## Rules

- **Locales:** `ar` (default) and `en`.
- **Routing:** every page lives under `src/app/[locale]/…`, giving `/ar/…` and `/en/…`.
  Locale detection and redirects run in Next.js's request proxy file, as described in the
  next-intl setup guide for Next.js 16.
- **Messages:** `messages/ar.json` and `messages/en.json`, grouped by screen
  (`auth`, `catalog`, `loans`, `fines`, `librarian`, `errors`). Both files must have the
  same keys.
- **Direction:** the root layout sets `<html lang dir>` from the locale (`ar` → `rtl`,
  `en` → `ltr`).
- **No hard-coded UI text** in components. Every string comes from the messages files.
- **Business errors are codes, not text.** Services throw `DomainError` with a code
  (e.g. `LOAN_LIMIT_REACHED`); actions return the code; the presentation layer translates
  it with `errors.<CODE>` (T006). Zod error messages are also message keys (T005).
- **Formatting:** dates, numbers, and money go through next-intl formatters, with Western
  digits (`latn` numbering) in both locales (P013).
- Services and repositories never import next-intl; translation is presentation only.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Hand-rolled dictionaries | We'd re-build routing, pluralization, and formatting ourselves. |
| react-i18next | Built for client-side React; weaker fit for Server Components. |
| Arabic only | Rejected in P013. |

## Consequences

- Positive: Translated text works the same in Server Components, Server Actions, and client
  components.
- Positive: Error codes keep business logic language-free.
- Trade-off: Every new string must be added to both messages files.
- Trade-off: All routes sit under `[locale]`.
