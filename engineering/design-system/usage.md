# Using the Design System

How to apply the tokens ([tokens.md](tokens.md)) when building screens. If a pattern
below covers your case, use it as-is instead of inventing a new one.

## Golden rules

1. Use **components first** ([components.md](components.md)). Raw utility classes are for
   layout (grid, flex, gap, padding) and one-off composition.
2. Only black, white, and the gray tokens. No arbitrary colors.
3. Square corners. Never add `rounded-*` except `rounded-full` for avatars.
4. Borders are black and at least 2px. Shadows are hard and black.
5. Every status has **text + icon**, never color or shade alone.
6. Numbers (dates, money, counts) use `font-mono`.
7. Use logical spacing utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`,
   `text-start`, `text-end`) instead of left/right (`ml-*`, `pr-*`, `text-left`, …), so
   the layout mirrors automatically between Arabic and English (P013).
8. No hard-coded text. Every string comes from the messages files (T010).

## Core patterns

### Surface (card, panel)

```
bg-white border-3 border-black shadow-sm
```

Heavy panel (page header, hero): `border-4 shadow-lg`.

### Pressable (button, clickable card)

The element sits on its shadow, lifts on hover, and sinks on press.

```
border-3 border-black shadow-sm
motion-safe:transition-[translate,box-shadow] motion-safe:duration-100 ease-snap
hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md
active:translate-x-1 active:translate-y-1 active:shadow-none
```

This is built into the `Button` variants; you only write it by hand for custom
clickable surfaces like `BookCard`.

### Inverted (loud)

For the most important thing on a screen: primary actions, overdue, fines, errors.

```
bg-black text-white border-3 border-black
```

Use at most **one** inverted primary action per view; overdue/fine indicators may repeat.

### Muted / unavailable

```
bg-stripes text-gray-600 border-3 border-black
```

Combined with an "Unavailable" label. Don't lower opacity; stripes read as "blocked"
while keeping text readable.

### Dashed (pending / due soon / empty)

```
border-3 border-dashed border-black
```

### Label

```
text-xs font-bold ltr:uppercase ltr:tracking-wider
```

Never put `tracking-*` on text that can be Arabic without the `ltr:` prefix.

## States

| State | Treatment |
| --- | --- |
| Default | White surface, black 3px border, `shadow-sm` |
| Hover | Lift: translate −2px, `shadow-md`. On white surfaces without a shadow: `bg-gray-100` |
| Active / pressed | Sink: translate +4px, `shadow-none` |
| Focus (keyboard) | 3px black outline, 2px offset (global `:focus-visible`). Never remove it. |
| Selected / current | Inverted (`bg-black text-white`) |
| Disabled | `bg-gray-200 text-gray-500 border-gray-300 shadow-none cursor-not-allowed`, no hover motion |
| Loading | Keep the size; replace the label with a spinner icon + "Loading…" text, disable the control |
| Error (field) | Field keeps black border, gets `border-4`; message below in `text-sm font-bold` with an alert icon |

## Business statuses

Each status from the PRDs has one fixed look. Use the matching component
([components.md](components.md)) rather than restyling.

| Status | PRD | Look | English label | Arabic label |
| --- | --- | --- | --- | --- |
| Available | P005 | White, black border, check icon | `AVAILABLE · 2 COPIES` | `متاح · 2 نسخة` |
| Unavailable | P005 | Stripes, gray-600 text, x icon | `UNAVAILABLE` | `غير متاح` |
| On loan (on time) | P007 | White, black border, clock icon | `DUE OCT 30` | `الإرجاع 30 أكتوبر` |
| Due soon (≤ 2 days) | P011 | **Dashed** border, bold, alert icon | `DUE IN 2 DAYS` | `الإرجاع خلال يومين` |
| Overdue | P006, P009 | **Inverted**, alert icon | `OVERDUE · 3 DAYS · 15 EGP` | `متأخر · 3 أيام · 15 ج.م` |
| Unpaid fine | P010 | **Inverted**, wallet icon | `UNPAID · 25 EGP` | `غير مدفوعة · 25 ج.م` |
| Paid fine | P010 | White, gray-600 text, check icon | `PAID` | `مدفوعة` |
| Borrow blocked | P006, P010 | Inverted alert panel with the reason | `RETURN YOUR OVERDUE BOOKS BEFORE BORROWING` | `رجّع الكتب المتأخرة قبل ما تستلف كتب جديدة` |

The labels above are examples; the real text lives in `messages/ar.json` and
`messages/en.json` (T010).

## Formatting

All formatting goes through next-intl formatters with Western digits (T010, P013).

| Value | Arabic | English | Notes |
| --- | --- | --- | --- |
| Money | `25 ج.م` | `25 EGP` | Whole pounds, `font-mono` for the number (P009) |
| Dates | `30 أكتوبر` | `Oct 30` | Add the year if not the current year; `font-mono` for digits |
| Countdown | `خلال يومين` · `متأخر 3 أيام` | `Due in 2 days` · `3 days overdue` | Use plural rules from the formatter, not string concatenation |
| Counts | `2 / 3 كتب` | `2 / 3 books` | `font-mono` for the numbers |

## Right-to-left (Arabic)

The root layout sets `dir="rtl"` for Arabic and `dir="ltr"` for English. To keep both
correct:

| Concern | Rule |
| --- | --- |
| Spacing and position | Logical utilities only (`ms`, `me`, `ps`, `pe`, `start`, `end`, `text-start`) |
| Directional icons (arrows, chevrons, "back") | Flip in RTL: `rtl:-scale-x-100` |
| Non-directional icons (check, alert, clock) | Never flipped |
| Shadows and press motion | Not mirrored; always bottom-right (see [tokens](tokens.md)) |
| Letter-spacing / uppercase | `ltr:` only (see Label pattern) |
| Numbers, barcodes, ISBNs, emails | Wrap in `dir="ltr"` (or `<bdi>`) so they don't reorder inside Arabic text |
| Book titles | Shown as entered; wrap in `<bdi>` so an English title inside Arabic UI renders correctly |

Every screen is reviewed in **both** languages before it is done.

## Layout

- Page: `max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12`.
- Vertical rhythm between sections: `gap-8` / `gap-12`.
- Book catalog: grid, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.
- Leave room for shadows: a container holding shadowed items needs at least 8px of
  padding on the end and bottom, or the shadow gets clipped.

## Icons

- `lucide-react`, `strokeWidth={2.5}`, size 16–20px next to text, 24px standalone.
- Icons support a label; they never replace one (except icon buttons, which need an
  `aria-label`).

## Do / Don't

| Do | Don't |
| --- | --- |
| `bg-black text-white` for the one primary action | Several competing black buttons in one view |
| Show "Overdue" as an inverted badge with text | Rely on gray shade alone to show a status |
| `border-3 shadow-sm` on cards | Soft, blurred shadows or `rounded-xl` |
| Stripes for unavailable items | `opacity-50` on content people still need to read |
| `font-mono` for `25 EGP` | Mixed fonts inside one number |
| `ms-4`, `text-start` | `ml-4`, `text-left` |
| `ltr:tracking-wider` | `tracking-wider` on Arabic text |
| Text from `messages/*.json` | Hard-coded strings in components |
| Customize a component in `components/ui/` | Copy-paste long class lists at every call site |
