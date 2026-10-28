# P013 — UI Language

| Field | Value |
| --- | --- |
| ID | P013 |
| Status | Accepted |
| Area | Brand / UI |
| Created | 2026-10-20 |
| Related | P009, P012 |

## Context

Members are in Egypt, but the library should also be usable in English. The language
affects text direction, fonts, and how money, dates, and messages are shown.

## Decision

The UI is available in **Arabic and English**, and members can switch between them at any
time. Arabic is the default.

## Rules

- **Default language:** Arabic (right-to-left). English is left-to-right.
- A language switcher is visible on every page, including login and sign up. The choice is
  remembered for the next visit.
- The language is part of the URL (`/ar/books`, `/en/books`), so links open in the same
  language.
- **All interface text is translated:** labels, buttons, statuses, and every business
  message (e.g. "You already have 3 books borrowed").
- **Book data is not translated.** Titles, authors, and descriptions are shown as the
  librarian entered them.
- **Money:** Arabic `25 ج.م` · English `25 EGP` (P009).
- **Digits:** Western digits (0–9) in both languages, so numbers look the same everywhere
  and line up in tables.
- **Dates:** month names in the selected language: Arabic `30 أكتوبر` · English `Oct 30`.

## Acceptance criteria

- [ ] A first-time visitor sees the Arabic, right-to-left UI.
- [ ] Switching to English changes every interface text and flips the layout to
      left-to-right.
- [ ] The chosen language is kept on the next visit and in shared links.
- [ ] Business messages (borrow blocked, fines, due soon) appear in the selected language.

## Open questions

### P013-Q1 — Which language(s) does the UI support in v1?

- **A.** Arabic only, right-to-left
- **B.** English only, left-to-right
- **C.** Both, with a language switcher

**Recommendation:** A, since members are in Egypt.

**Answer:** C — decided by product owner on 2026-10-20. Arabic is the default.
