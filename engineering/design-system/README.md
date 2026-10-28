# Design System — Overview

The Mini Library UI is **neo-brutalist and monochrome**: black and white, a small gray
scale, thick borders, hard shadows, square corners, and heavy type. It should feel bold,
direct, and a little aggressive, like a printed poster or a stamped library card.

Decisions behind it: [P012](../../prds/P012-visual-identity.md) (visual identity),
[T007](../../tdrs/T007-tailwind-css-v4.md) (Tailwind CSS v4),
[T008](../../tdrs/T008-shadcn-ui-components.md) (shadcn/ui),
[T009](../../tdrs/T009-neo-brutalist-design-system.md) (design system),
[P013](../../prds/P013-ui-language.md) and [T010](../../tdrs/T010-next-intl-i18n.md)
(Arabic + English).

## Files

| File | What it covers |
| --- | --- |
| [README.md](README.md) | Principles and the overall look (this file) |
| [tokens.md](tokens.md) | Every design token and its Tailwind v4 implementation |
| [usage.md](usage.md) | How to apply the system: patterns, states, do / don't |
| [components.md](components.md) | shadcn/ui base components and app components |

## Principles

1. **Ink on paper.** Black on white is the default. Gray is for support (muted text,
   disabled, backgrounds), never the main voice.
2. **Hard edges.** Square corners, 3px black borders, shadows offset with zero blur.
3. **Loud means inverted.** With no color available, the most important states (overdue,
   fines, errors, primary actions) flip to white on black.
4. **Never color alone.** Every status has a text label and an icon. This also makes the
   UI accessible to color-blind users.
5. **Physical interaction.** Buttons and cards press into their shadow when clicked.
6. **Big, heavy type.** Headings are large and bold; labels are uppercase in English;
   numbers (dates, fines, counts) are monospace.
7. **Two directions, one look.** Arabic (RTL, default) and English (LTR) look the same,
   mirrored (P013, T010).
8. **Few tokens, strict use.** Only what's in [tokens.md](tokens.md) exists. Tailwind's
   default palette, radii, and shadows are removed.

## The look in one component

A primary button, at rest, hovered, and pressed:

```
 rest                 hover                pressed
┌──────────────┐     ┌──────────────┐
│▓▓ BORROW ▓▓▓▓│█    │▓▓ BORROW ▓▓▓▓│██      ┌──────────────┐
└──────────────┘█    └──────────────┘██      │▓▓ BORROW ▓▓▓▓│
 ████████████████     ████████████████        └──────────────┘
 black block, 3px     lifts, shadow grows     sinks into shadow
 border, 4px shadow   to 6px                  position, no shadow
```

## Layers

The design system lives entirely in the **presentation layer**
([architecture](../architecture.md)):

```
src/app/globals.css         tokens (@theme) + base styles     → tokens.md
src/components/ui/          shadcn/ui components, restyled    → components.md
src/components/             app components built from ui/     → components.md
src/app/**/page.tsx         pages compose app components
```

## Scope

- One light theme. No dark mode in v1.
- Arabic (RTL, default) and English (LTR).
- Desktop and mobile (responsive, mobile-first).
- WCAG AA contrast for all text.
