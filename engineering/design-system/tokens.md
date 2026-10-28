# Design Tokens

All tokens are defined once in `src/app/globals.css` using Tailwind CSS v4's `@theme`
(T007). Tailwind turns each token into utility classes (e.g. `--color-gray-100` →
`bg-gray-100`, `--shadow-md` → `shadow-md`).

Tailwind's default palette, radii, and shadows are **reset**, so only the tokens below
exist.

## Color

### Base palette

| Token | Value | Class example | Use |
| --- | --- | --- | --- |
| `--color-black` | `#000000` | `bg-black`, `text-black`, `border-black` | Ink: text, borders, shadows, primary actions |
| `--color-white` | `#ffffff` | `bg-white`, `text-white` | Paper: page and surfaces |
| `--color-gray-50` | `#fafafa` | `bg-gray-50` | Subtle page sections |
| `--color-gray-100` | `#f0f0f0` | `bg-gray-100` | Muted surfaces, table header, hover on white |
| `--color-gray-200` | `#e0e0e0` | `bg-gray-200` | Disabled backgrounds, unavailable items |
| `--color-gray-300` | `#c7c7c7` | `border-gray-300` | Disabled borders, stripe pattern |
| `--color-gray-400` | `#a3a3a3` | `text-gray-400` | Placeholder icons only (not text) |
| `--color-gray-500` | `#737373` | `text-gray-500` | Disabled text, placeholder text |
| `--color-gray-600` | `#525252` | `text-gray-600` | Secondary text |
| `--color-gray-700` | `#3d3d3d` | `text-gray-700` | Body text when black is too heavy |
| `--color-gray-800` | `#262626` | `bg-gray-800` | Hover on black |
| `--color-gray-900` | `#141414` | `bg-gray-900` | Pressed on black |

**Contrast rule:** text on white uses `gray-500` or darker (gray-500 is 4.7:1, AA).
`gray-400` and lighter are never used for text.

### Semantic colors (shadcn/ui variables)

shadcn/ui components read these variables (T008). They all point to the base palette.

| Variable | Value | Meaning |
| --- | --- | --- |
| `--background` / `--foreground` | white / black | Page |
| `--card` / `--card-foreground` | white / black | Cards, panels |
| `--popover` / `--popover-foreground` | white / black | Dropdowns, popovers |
| `--primary` / `--primary-foreground` | black / white | Primary actions |
| `--secondary` / `--secondary-foreground` | white / black | Secondary actions |
| `--muted` / `--muted-foreground` | gray-100 / gray-600 | Muted surfaces and text |
| `--accent` / `--accent-foreground` | gray-100 / black | Hover / highlighted items |
| `--destructive` / `--destructive-foreground` | black / white | Destructive & alert: **inverted**, not red |
| `--border` | black | All borders |
| `--input` | black | Input borders |
| `--ring` | black | Focus outline |

## Typography

### Font families

| Token | Font stack | Use |
| --- | --- | --- |
| `--font-sans` | **Space Grotesk** → **IBM Plex Sans Arabic** → `ui-sans-serif, system-ui` | Everything by default |
| `--font-mono` | **Space Mono** → `ui-monospace` | Numbers: dates, due dates, fines, counts, barcodes |

The UI is bilingual (P013). Space Grotesk has no Arabic letters, so the browser takes
Latin letters and digits from Space Grotesk and Arabic letters from IBM Plex Sans Arabic,
in both languages. One stack, no per-locale switching. Digits are always Western (0–9)
and come from Space Grotesk / Space Mono.

Fonts are loaded with `next/font/google` in the root layout and exposed as CSS variables
(`--font-space-grotesk`, `--font-plex-arabic`, `--font-space-mono`). Load IBM Plex Sans
Arabic with the `arabic` subset and weights 500 and 700.

### Weights

| Class | Weight | Use |
| --- | --- | --- |
| `font-medium` | 500 | Body text |
| `font-bold` | 700 | Headings, buttons, labels, badges |

No light or thin weights.

### Type scale

| Class | Size / line height | Use |
| --- | --- | --- |
| `text-xs` | 12px / 16px | Badges, meta labels (uppercase) |
| `text-sm` | 14px / 20px | Secondary text, table cells, helper/error text |
| `text-base` | 16px / 24px | Body, inputs, buttons |
| `text-lg` | 18px / 28px | Card titles |
| `text-xl` | 20px / 28px | Section titles |
| `text-2xl` | 24px / 32px | Page sub-headings |
| `text-4xl` | 40px / 44px | Page titles |
| `text-6xl` | 64px / 64px | Display: hero, big numbers (e.g. fine total) |

### Letter case and tracking

Arabic letters connect to each other, so **letter-spacing must never apply to Arabic**:
it breaks the joins. Arabic has no uppercase either. Both are applied only in the
English (LTR) UI with Tailwind's `ltr:` variant.

| Pattern | Classes | Use |
| --- | --- | --- |
| Label | `text-xs font-bold ltr:uppercase ltr:tracking-wider` | Badges, form labels, table headers |
| Heading | `font-bold ltr:tracking-tight` | All headings |

In Arabic, labels get their weight from `font-bold` alone.

## Borders

Tailwind v4 accepts any pixel width as a number (`border-3` = 3px). Borders are always
`border-black` unless disabled.

| Class | Width | Use |
| --- | --- | --- |
| `border-2` | 2px | Dense UI: table cells, small badges, checkboxes |
| `border-3` | 3px | **Default** for buttons, inputs, cards, dialogs |
| `border-4` | 4px | Heavy: page header, hero, important panels |
| `border-dashed` | — | "Due soon" and empty states |

## Radius

All radius tokens are reset; corners are **square everywhere**. The only exception is
`rounded-full` for avatars and radio dots.

## Shadows

Hard offset shadows, zero blur, always black. Shadows fall to the **bottom-right in both
languages** (a fixed light source), so they are not mirrored in RTL; the press motion
uses physical `translate-x` to match. They replace Tailwind's defaults, so
shadcn/ui components that use `shadow-xs`/`shadow-sm` become brutalist automatically.

| Token / class | Value | Use |
| --- | --- | --- |
| `shadow-xs` | `2px 2px 0 0 #000` | Badges, small controls |
| `shadow-sm` | `4px 4px 0 0 #000` | **Default** for buttons, inputs, cards |
| `shadow-md` | `6px 6px 0 0 #000` | Hover state of pressables |
| `shadow-lg` | `8px 8px 0 0 #000` | Dialogs, popovers, hero panels |
| `shadow-none` | none | Pressed state, flat elements |

## Spacing

Tailwind's default 4px spacing scale (`--spacing: 0.25rem`), unchanged. Prefer
multiples of 2 (`p-2`, `p-4`, `gap-6`, `gap-8`) to keep the layout chunky.

## Layout

| Token | Value | Use |
| --- | --- | --- |
| Container | `max-w-6xl mx-auto px-4 md:px-8` | Page content width |
| Breakpoints | Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280) | Mobile-first |

## Motion

Short and snappy; nothing floats or fades slowly.

| Token | Value | Use |
| --- | --- | --- |
| `--ease-snap` | `cubic-bezier(0.2, 0, 0, 1)` | All transitions (`ease-snap`) |
| Duration | `duration-100` | Press / hover |
| Duration | `duration-150` | Dialogs, popovers |

All movement is wrapped in `motion-safe:` so it is disabled for users who prefer reduced
motion.

## Patterns

| Utility | Look | Use |
| --- | --- | --- |
| `bg-stripes` | 45° gray-300 stripes on white | Unavailable books, withdrawn copies, disabled areas |

## Implementation: `src/app/globals.css`

The shape of the file. `shadcn init` (T008) generates a version of this; replace its
color, radius, and dark-mode sections with the values below.

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme {
  /* Only design-system colors exist */
  --color-*: initial;
  --color-black: #000000;
  --color-white: #ffffff;
  --color-gray-50: #fafafa;
  --color-gray-100: #f0f0f0;
  --color-gray-200: #e0e0e0;
  --color-gray-300: #c7c7c7;
  --color-gray-400: #a3a3a3;
  --color-gray-500: #737373;
  --color-gray-600: #525252;
  --color-gray-700: #3d3d3d;
  --color-gray-800: #262626;
  --color-gray-900: #141414;

  /* Square corners */
  --radius-*: initial;

  /* Hard shadows */
  --shadow-*: initial;
  --shadow-xs: 2px 2px 0 0 var(--color-black);
  --shadow-sm: 4px 4px 0 0 var(--color-black);
  --shadow-md: 6px 6px 0 0 var(--color-black);
  --shadow-lg: 8px 8px 0 0 var(--color-black);

  /* Type */
  --font-sans: var(--font-space-grotesk), var(--font-plex-arabic), ui-sans-serif,
    system-ui, sans-serif;
  --font-mono: var(--font-space-mono), ui-monospace, monospace;
  --text-4xl: 2.5rem;
  --text-4xl--line-height: 2.75rem;
  --text-6xl: 4rem;
  --text-6xl--line-height: 4rem;

  /* Motion */
  --ease-snap: cubic-bezier(0.2, 0, 0, 1);
}

:root {
  --background: var(--color-white);
  --foreground: var(--color-black);
  --card: var(--color-white);
  --card-foreground: var(--color-black);
  --popover: var(--color-white);
  --popover-foreground: var(--color-black);
  --primary: var(--color-black);
  --primary-foreground: var(--color-white);
  --secondary: var(--color-white);
  --secondary-foreground: var(--color-black);
  --muted: var(--color-gray-100);
  --muted-foreground: var(--color-gray-600);
  --accent: var(--color-gray-100);
  --accent-foreground: var(--color-black);
  --destructive: var(--color-black);
  --destructive-foreground: var(--color-white);
  --border: var(--color-black);
  --input: var(--color-black);
  --ring: var(--color-black);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

@utility bg-stripes {
  background-color: var(--color-white);
  background-image: repeating-linear-gradient(
    45deg,
    var(--color-gray-300) 0 2px,
    transparent 2px 10px
  );
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans font-medium antialiased;
  }
  h1, h2, h3, h4 {
    @apply font-bold ltr:tracking-tight;
  }
  :focus-visible {
    @apply outline-3 outline-offset-2 outline-black;
  }
}
```
