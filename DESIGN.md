---
name: SpendIt
description: A quiet, precise desktop instrument for keeping a personal ledger.
colors:
  # Surfaces — light
  surface: "#F8F8FA"
  surface-raised: "#FFFFFF"
  surface-sunken: "#F2F2F7"
  separator: "rgba(0, 0, 0, 0.07)"
  # Surfaces — dark
  surface-dark: "#000000"
  surface-raised-dark: "#1C1C1E"
  surface-sunken-dark: "#2C2C2E"
  separator-dark: "rgba(255, 255, 255, 0.08)"
  # Ink
  ink-primary: "#191C1A"
  ink-primary-dark: "#EBF0ED"
  ink-secondary: "#5F6B65"
  ink-secondary-dark: "#9BA8A1"
  ink-tertiary: "#8E9C94"
  ink-body: "#2A302C"
  ink-muted: "#3D4641"
  rule: "#D1D1D6"
  rule-light: "#C7C7CC"
  # Accents — system-derived, each carrying one fixed meaning
  accent: "#007AFF"
  accent-dark: "#0A84FF"
  # AA-safe accent pair. #007AFF is the identity hue, but it clears only ~4.0:1
  # against white in either direction, so text and fills use these instead.
  accent-text: "#0067D6"
  accent-text-dark: "#4DA3FF"
  accent-fill: "#0069DB"
  accent-fill-hover: "#0058B8"
  accent-fill-dark: "#0A6FD8"
  accent-fill-hover-dark: "#0A84FF"
  positive: "#34C759"
  negative: "#FF3B30"
  caution: "#FF9500"
  transfer: "#5856D6"
  # Category identity palette — user-assignable marks for accounts, categories,
  # and jars. These identify, they do not signal state.
  category-blue: "#007AFF"
  category-green: "#34C759"
  category-indigo: "#5856D6"
  category-orange: "#FF9500"
  category-pink: "#FF2D55"
  category-purple: "#AF52DE"
  category-red: "#FF3B30"
  category-teal: "#5AC8FA"
  category-yellow: "#FFCC00"
  category-gray: "#8E8E93"
typography:
  display:
    fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif'
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.022em"
  headline:
    fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif'
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.018em"
  title:
    fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif'
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.012em"
  body:
    fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: "-0.006em"
  label:
    fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif'
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.38
    letterSpacing: "0"
  mono:
    fontFamily: '"Space Mono", "JetBrains Mono", ui-monospace, monospace'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
  numeric:
    fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif'
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "22px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "#0069DB"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "rgba(0, 0, 0, 0.05)"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-destructive:
    backgroundColor: "{colors.negative}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  inset-group:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    padding: "0"
  list-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    padding: "12px 16px"
  input:
    backgroundColor: "rgba(0, 0, 0, 0.04)"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  dialog:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.xl}"
    padding: "20px 24px"
---

# SpendIt Design System

## Overview

**North star: The Quiet Instrument.**

SpendIt is a precision tool for a private, daily task. The interface is the case around the
instrument, not the instrument itself: surfaces recede, the user's own numbers lead, and color
appears only where it carries meaning. The visual language is Apple-esque — iOS/macOS materials,
inset-grouped lists, system accent semantics, spring motion — applied with a desktop app's density
and a ledger's respect for numbers.

The test for any new screen: *if you removed every decorative element, would the screen still tell
the user what they came to find out?* If yes, remove them. If no, the hierarchy is wrong.

This system replaced an earlier warm-paper/handwritten-diary direction. That direction is retired:
its vocabulary survives in a few product nouns ("folio", "ledger", "jars"), but its materials —
ruled paper, wax seals, washi tape, handwriting faces, the `archival-*` ramp — are **not** part of
this system and must not be reintroduced as decoration.

**Platform reality.** This ships as an installed Tauri desktop app on Windows. Design for a resizable
desktop window first. Layouts stay responsive down to tablet width, but phone-web is not a shipping
target and must never drive a decision that costs desktop density.

## Colors

Color is semantic, never decorative. A hue in this interface is a claim about meaning.

| Role | Light | Dark | Means |
|---|---|---|---|
| `accent` | `#007AFF` | `#0A84FF` | The identity hue. Focus rings, tints, icons, large elements. |
| `accent-text` | `#0067D6` | `#4DA3FF` | Accent-colored **text**. Use `.text-accent`, never a raw blue. |
| `accent-fill` | `#0069DB` | `#0A6FD8` | Filled buttons carrying white text. Use `.bg-accent`. |
| `positive` | `#34C759` | `#34C759` | Money in, goal met, day sealed, reconciled. |
| `negative` | `#FF3B30` | `#FF3B30` | Destructive actions and error states. Not used for ordinary expenses — a normal spend is not an error. |
| `caution` | `#FF9500` | `#FF9500` | Due soon, over budget, needs attention. |
| `transfer` | `#5856D6` | `#5856D6` | Movement between the user's own accounts. Neither income nor expense. |

**Category colors** are a separate, non-semantic set: the ten system hues above, offered as
identity marks the user assigns to an account, category, or jar. They never carry state meaning —
a purple category is not "worse" than a green one. Keep them out of status indicators.

**Surfaces** are a three-step depth ladder, never more: sunken (`surface-sunken`) for grouped
backgrounds, base (`surface`) for the page, raised (`surface-raised`) for cards, dialogs, and
popovers. Dark mode is true black (`#000000`) so the app sits correctly on OLED and in a dark room,
with raised surfaces at `#1C1C1E`.

**Ink** has exactly three levels. `ink-primary` for content, `ink-secondary` for supporting text
(this is the level most UI text lands on), `ink-tertiary` for genuinely incidental marks only.
`ink-secondary` is theme-paired — `#5F6B65` on light, `#9BA8A1` on dark — because a single mid-gray
cannot clear 4.5:1 against both white and black. Use the `.text-secondary` utility rather than
picking a numbered ink shade by eye.

**Expense amounts are ink, not red.** Red in a ledger means "something is wrong". The overwhelming
majority of entries are ordinary spending, and coloring them all red makes the color meaningless
and the ledger anxious. Sign and position carry the direction; color is reserved for the exceptions.

## Typography

One family: **Plus Jakarta Sans**, with Inter and the system UI stack as fallbacks. Numerals are
always tabular (`tnum`) wherever amounts are stacked — a ledger column that doesn't align is a
broken ledger.

| Role | Size | Weight | Use |
|---|---|---|---|
| `display` | 34px | 600 | The one number a screen exists to show. Balance headers, day totals. |
| `headline` | 24px | 600 | View titles. |
| `title` | 20px | 600 | Section and card titles. |
| `body` | 15px | 400 | Default. All running text, list rows, form values. |
| `label` | 13px | 500 | Supporting text, captions, metadata, chip labels. |
| `numeric` | 15px | 600 | Amounts in rows. Tabular figures, tighter tracking. |
| `mono` | 13px | 400 | **Space Mono.** Reserved for measurement and data — ledger columns, printed registers, keyboard hints. Never as a costume for "technical" on prose. |

**13px is the floor.** Nothing in this interface renders below it — not timestamps, not tags, not
helper text. The previous system put roughly ninety percent of its text at 10–12px, which
collapsed hierarchy into "small" versus "heading" and made the app unreadable at arm's length on a
desktop monitor.

Every screen needs at least three distinct levels present. If a card contains only 13px and 15px
text, nothing in it is ranked, and the user has to read all of it to find anything.

## Layout

Content sits in a `max-w-7xl` centered container with `16px` gutters, rising to `24px` at `sm`.

Spacing follows a 4px base: `4 / 8 / 12 / 16 / 24 / 32`. Group tightly, separate generously — more
space above a heading than below it, so headings bind to what they introduce.

**Inset-grouped lists** are the primary organizing structure, as in iOS Settings: a rounded
container holding full-bleed rows separated by hairline dividers that inset to align with the row's
text, not the container edge. Prefer a grouped list over a grid of cards. Nested cards are always
wrong.

Breakpoints are Tailwind defaults. Below `sm` the app uses a bottom tab bar; at `sm` and up, a
single top bar carries navigation and actions.

## Elevation & Depth

Depth is material, not shadow-stacking. Three levels:

1. **Flat** — content on the page. No shadow.
2. **Raised** — `shadow-apple-card`, a 2px offset with 8px blur. Cards and grouped lists.
3. **Floating** — `shadow-apple-float`, 16px offset with 36px blur. Dialogs, popovers, toasts.

Translucency (`backdrop-filter`) belongs to surfaces that overlay content — the top bar, dialogs,
the tab bar. It is a statement that something is *in front*. Glass on a static card is decoration
and is not used here.

Performance mode replaces every `backdrop-filter` with an opaque fill. Any glass surface must stay
legible when that happens, which means never relying on blur to create contrast.

## Shapes

A continuous-corner family, scaled to the element: `10px` for chips and small controls, `14px` for
buttons and inputs, `18px` for grouped containers and cards, `22px` for dialogs, full round for
avatars, badges, and pills.

Borders are hairlines — `1px` at ~7% black on light, ~8% white on dark. Heavier borders read as
boxes and fight the inset-group language. Colored left-borders on cards and callouts are not part
of this system.

## Components

### Inset group (`.apple-inset-group`)
The workhorse container. Rounded `18px`, hairline border, rows divided by hairlines. Rows are
`12px 16px`, with the label left and the value or control right.

### Segmented picker (`.apple-segmented-picker`)
For 2–4 mutually exclusive options. Above four, use a dropdown or a grouped list instead.

### Dialog (`Modal`)
Every dialog in the app is built from `src/components/ui/Modal.tsx` — never hand-rolled. It carries
`role="dialog"`, `aria-modal`, Escape-to-close, a focus trap, focus restoration, and scroll lock.
Header with title and optional subtitle, scrolling body, pinned footer for actions. On narrow
windows it rises from the bottom edge as a sheet.

### Destructive confirmation (`ConfirmDialog`)
Any irreversible action routes through it. It names the exact counts being destroyed, offers the
safer path (export a backup) as the visually primary action, and — where there is no recovery at
all — requires the user to type a confirmation phrase. Never a bare "Are you sure?".

### Toast (`ToastContext`)
The app's feedback surface. Success toasts auto-dismiss; **error toasts persist until dismissed**
and carry a recovery line. No failure in this app is allowed to reach only the console.

### Ledger row (`TransactionRow`)
Description and time left, tabular amount right. Expanding reveals notes, tags, and actions. When
the day is sealed, edit and delete are withdrawn rather than disabled-in-place.

### Accent utilities
`.text-accent` and `.bg-accent` are the only sanctioned ways to put accent color on text or a
filled control. They are theme-paired and shifted off `#007AFF` so both directions clear 4.5:1;
writing `text-apple-blue` or `bg-apple-blue` on small text reintroduces a contrast failure.

### Focus
Every interactive element shows a `2px` accent ring at `2px` offset on `:focus-visible`. Use the
`.focus-ring` utility when a component must suppress the default outline for shape reasons. A
suppressed outline with no replacement is a defect.

## Do's and Don'ts

### Do
- **Let the numbers lead.** The figure the user opened the screen for should be the largest thing on it.
- **Use tabular numerals for every amount.** Always.
- **Give color a job.** If you cannot say what a hue means in one word, use ink.
- **Route every dialog through `Modal` and every destructive action through `ConfirmDialog`.**
- **Surface every failure.** A caught error that only reaches `console.error` is a bug.
- **Honor `prefers-reduced-motion`.** Performance mode may force motion off; it may never force it on.
- **Design for the desktop window first**, then let the layout survive narrower.

### Don't
- **No decorative glass or blur.** Translucency means "in front of something". Nothing else.
- **No ambient gradient meshes or floating color orbs.** They destabilize text contrast and are the single most generic marker available.
- **No text below 13px.**
- **No confetti on routine actions.** A celebration on the fourth entry of the morning is friction. Reserve it for a genuine milestone, if at all.
- **No paper-diary revival.** Ruled paper, wax seals, washi tape, handwriting faces, and the `archival-*` ramp are retired. Don't reintroduce them.
- **No raw database identifiers, table names, or technical jargon in user-facing copy.**
- **No red for ordinary expenses.**
- **No cards-of-icon-plus-heading-plus-text as page structure.** Use grouped lists.
- **No touch-only copy** ("tap here") in a desktop app.
