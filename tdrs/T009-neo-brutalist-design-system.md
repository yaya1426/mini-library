# T009 — Neo-Brutalist Monochrome Design System

| Field | Value |
| --- | --- |
| ID | T009 |
| Status | Accepted |
| Area | UI / Design system |
| Date | 2026-10-20 |
| Related | T007, T008, T010, P012, P013 |

## Context

The product owner chose a bold, strong visual identity: neo-brutalism in black and white
(P012). The design system turns that into rules and tokens every screen follows.

## Decision

The UI follows a **neo-brutalist, monochrome** design system: black and white, with a
limited gray scale, thick black borders, hard offset shadows, square corners, and heavy
type. Full spec: [`engineering/design-system/`](../engineering/design-system/README.md).

## Rules

- **Colors:** only black, white, and the gray scale defined in the tokens. No other hue
  exists in the system (enforced by T007's palette reset).
- **Status is never shown by color alone** (there are no reds or greens). Every status
  uses a text label + icon + a visual treatment (inverted, striped, dashed), e.g.
  overdue and fines are shown **inverted** (white on black).
- **Shapes:** square corners, 3px black borders by default, hard shadows with no blur.
- **Interaction:** pressable elements visibly "press" into their shadow.
- **Single light theme.** No dark mode in v1.
- **Bilingual:** works in Arabic (RTL) and English (LTR) (P013, T010). Layout uses
  logical properties; letter-spacing and uppercase apply to Latin text only.
- **Accessibility:** text meets WCAG AA contrast; focus is always visible.
- New screens use existing tokens and components. A new token or component is added to
  the design-system docs in the same change.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Neo-brutalism with bright accent colors | Product owner chose monochrome only. |
| Minimal / soft UI (rounded, blurred shadows) | Doesn't match the chosen identity. |

## Consequences

- Positive: A distinctive, consistent look with very few tokens to maintain.
- Positive: High contrast is accessible by default.
- Trade-off: Without color, warnings and errors need extra care (labels, icons, inversion)
  so they still stand out.
