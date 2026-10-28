# T008 — shadcn/ui as the Component Base

| Field | Value |
| --- | --- |
| ID | T008 |
| Status | Accepted |
| Area | UI / Components |
| Date | 2026-10-20 |
| Related | T006, T007, T009 |

## Context

We need accessible base components (buttons, inputs, dialogs, tables, …) that we can
restyle completely into a neo-brutalist look (T009). Packaged UI libraries ship their own
look and are hard to override.

## Decision

Use **shadcn/ui** (latest version, Tailwind v4 compatible) as the starting point for React
components. Components are copied into our repo and restyled with our tokens.

## Rules

- Initialize and add components with the official CLI:
  ```
  npx shadcn@latest init
  npx shadcn@latest add button input label card badge …
  ```
- Generated components live in `src/components/ui/` and are **our code**. We edit them
  to match the design system; we do not keep the default shadcn look.
- After `init`, the generated theme variables in `globals.css` are replaced with the
  design-system values ([tokens](../engineering/design-system/tokens.md)). No dark theme
  (T009).
- Customize a component **once**, in its `ui/` file (variants, sizes). Don't override the
  same component's look with long class lists at every call site.
- App-specific components (e.g. `BookCard`, `AvailabilityBadge`) live in
  `src/components/` and are built **from** `ui/` components.
- Use the `cn()` helper (`src/lib/utils.ts`, created by `init`) to merge classes.
- Icons: `lucide-react` (shadcn's default), with a heavier stroke to match the style.
- Forms submit to Server Actions (T003) and show errors returned by the action
  (`useActionState`). We don't add a client form library in v1.
- shadcn/ui components are part of the **presentation layer** (T006). They never call
  services or repositories.

## Alternatives considered

| Option | Why not |
| --- | --- |
| MUI / Chakra / Mantine | Strong built-in look that fights neo-brutalism; heavy to override. |
| Ready-made neo-brutalist kits | Less mature; we'd still need to own and adapt them. |
| Build everything from scratch | Re-implementing accessible dialogs, menus, and focus handling is costly. |

## Consequences

- Positive: Accessible behavior (keyboard, focus, ARIA) comes from shadcn's primitives.
- Positive: Full control of the look because the code is ours.
- Trade-off: Updates from shadcn are not automatic; re-adding a component overwrites local
  changes and must be reviewed.
