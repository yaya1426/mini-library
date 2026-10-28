# P012 — Visual Identity

| Field | Value |
| --- | --- |
| ID | P012 |
| Status | Accepted |
| Area | Brand / UI |
| Created | 2026-10-20 |
| Related | P005, P009, P011, P013 |

## Context

The library should have a recognizable look that feels bold and strong.

## Decision

The product uses a **neo-brutalist** visual identity in **black and white** (grays
allowed). Implemented by the design system in T009.

## Rules

- No brand colors other than black, white, and grays.
- Important states members must notice are made loud through contrast, not color:
  - Overdue loans and fines (P009, P010) are shown inverted (white on black).
  - Loans due soon (P011) are clearly marked "Due soon".
  - Unavailable books (P005) are visibly muted and labeled "Unavailable".
- Money is always shown with its currency, e.g. "25 ج.م" / "25 EGP" (P009, P013).
- The identity looks the same in Arabic (RTL) and English (LTR) (P013).

## Acceptance criteria

- [ ] No screen uses a color other than black, white, or gray.
- [ ] A member can tell overdue, due soon, available, and unavailable apart without
      relying on color.

## Open questions

None.
