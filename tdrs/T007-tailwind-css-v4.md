# T007 — Tailwind CSS v4 for Styling

| Field | Value |
| --- | --- |
| ID | T007 |
| Status | Accepted |
| Area | UI / Styling |
| Date | 2026-10-20 |
| Related | T001, T008, T009 |

## Context

The UI needs one styling approach that makes the design system (T009) easy to apply
consistently, works with Next.js 16 (T001), and is what shadcn/ui (T008) is built on.

## Decision

Style the app with **Tailwind CSS v4** (the latest major version). No earlier versions,
no other CSS framework, no CSS-in-JS.

## Rules

- Install Tailwind through the Next.js setup: choose Tailwind when running
  `create-next-app` (T001). This uses the v4 PostCSS plugin (`@tailwindcss/postcss`).
- Use the v4 **CSS-first configuration**. There is **no `tailwind.config.js`**.
  Everything is configured in `src/app/globals.css`:
  - `@import "tailwindcss";` to load Tailwind.
  - `@theme { … }` to define the design tokens (colors, fonts, shadows, …).
  - `@utility` for the few custom utilities the design system needs.
- Design tokens are defined **once** in `globals.css` and documented in
  [`engineering/design-system/tokens.md`](../engineering/design-system/tokens.md).
- The default Tailwind palette, radii, and shadows are **reset** (`--color-*: initial`,
  etc.) so that only design-system tokens exist. A class like `bg-blue-500` or
  `rounded-lg` produces no styles.
- Style with utility classes in components. Use `@apply` and custom CSS only for base
  element styles in `globals.css`.
- No arbitrary color values (`bg-[#ff0000]`). Arbitrary values for sizes are allowed only
  when no token fits, and are a signal to add a token.
- Merge conditional classes with the `cn()` helper (T008).

## Alternatives considered

| Option | Why not |
| --- | --- |
| Tailwind CSS v3 | Older major version with JS config; v4 is current and what new Next.js and shadcn/ui setups use. |
| CSS Modules / plain CSS | Harder to keep a token-driven system consistent across many components. |
| CSS-in-JS (styled-components, Emotion) | Runtime cost and friction with Server Components. |

## Consequences

- Positive: Tokens live in CSS as variables, usable by Tailwind classes and plain CSS.
- Positive: Resetting the defaults makes off-system colors impossible by construction.
- Trade-off: Some v3-era examples and plugins online don't apply; follow v4 docs only.
