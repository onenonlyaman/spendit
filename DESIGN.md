---
name: SpendIt
description: A physical handwritten financial diary and archival ledger manager with modern double-entry accounting integrity.
colors:
  paper-50: "#FCFAF6"
  paper-100: "#FBF7F0"
  paper-200: "#F5EFE4"
  paper-300: "#ECE2D0"
  paper-400: "#DECDB4"
  paper-dark: "#1C1B18"
  paper-dark-card: "#24231F"
  paper-dark-border: "#383630"
  ink-900: "#191C1A"
  ink-800: "#2A302C"
  ink-700: "#3D4641"
  ink-600: "#546059"
  ink-500: "#6E7D74"
  ink-400: "#8E9C94"
  archival-ochre: "#C07D2B"
  archival-brass: "#8C6D37"
  archival-green: "#2A6F4E"
  archival-red: "#B83A3A"
  archival-blue: "#235789"
typography:
  display:
    fontFamily: "Newsreader, Playfair Display, Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Newsreader, Playfair Display, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Space Mono, JetBrains Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 700
    letterSpacing: "0.08em"
    textTransform: "uppercase"
  body:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
  caption:
    fontFamily: "Space Mono, JetBrains Mono, monospace"
    fontSize: "11px"
    fontWeight: 500
  micro:
    fontFamily: "Space Mono, JetBrains Mono, monospace"
    fontSize: "10px"
    fontWeight: 500
  stamp:
    fontFamily: "Space Mono, JetBrains Mono, monospace"
    fontSize: "8px"
    fontWeight: 700
  handwriting:
    fontFamily: "Caveat, Kalam, cursive"
    fontSize: "1.125rem"
    lineHeight: 1.35
  mono:
    fontFamily: "Space Mono, JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.paper-50}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-accent:
    backgroundColor: "{colors.archival-ochre}"
    textColor: "{colors.paper-50}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-folio:
    backgroundColor: "{colors.paper-50}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: SpendIt

## Overview

**Creative North Star: "The Smyth-Sewn Archival Ledger & Hand-Stitched Financial Folio"**

SpendIt rejects the cold, clinical look of modern corporate SaaS banking dashboards. Instead, it emulates the tactile warmth, personal permanence, and deliberate mindfulness of a physical, Smyth-sewn leather financial journal. Every transaction is recorded like ink upon ivory parchment, accompanied by handwritten marginalia, authentic rubber stamps, and physical bookmark ribbons.

The interface balances controlled imperfection with mathematical rigor. While the visual aesthetic feels like a personal diary from an apothecary or artisan bookkeeper, the financial engine operates with double-entry accounting integrity, dynamic safe-to-spend compassing, and localized Indian currency (`₹` INR) support.

### Key Characteristics
- **Tactile Paper Surfaces**: Warm ivory (`#FCFAF6`), warm parchment ruling, and candlelit obsidian dark themes.
- **Typographic Harmony**: Classic literary serif headlines (`Newsreader` / `Playfair Display`), crisp monospaced ledger balances (`Space Mono` / `JetBrains Mono`), and organic handwritten marginalia (`Caveat`).
- **Physical Affordances**: Ribbon bookmarks for "Today", wax seal stamps for end-of-day reconciliation, washi-tape tabs, and apothecary honey jars for sinking funds.
- **Print Fidelity**: Clean vector printable journal sheets formatted for physical binder archiving.

---

## Colors

The color palette is derived from aged rag paper, mineral-based inks, and brass desk implements.

```
Primary Inks:
├── Deep Charcoal Ink       (#191C1A) — Primary text, prominent buttons, folio stamps
├── Muted Slate Ink         (#546059) — Subtitles, table headers, metadata
└── Subtle Margin Ink       (#8E9C94) — Timestamps, tags, borders

Parchment Surfaces:
├── Pure Ivory Folio        (#FCFAF6) — Main ledger sheet, cards
├── Cream Parchment         (#FBF7F0) — App background, page canvas
├── Warm Laid Paper         (#F5EFE4) — Secondary cards, input fields
└── Aged Paper Ruling       (#ECE2D0) — Ruled lines, dividers, subtle borders

Archival Accent Mineral Inks:
├── Archival Ochre          (#C07D2B) — Highlights, primary accents, savings goals
├── Vintage Brass           (#8C6D37) — Account badges, metadata accents
├── Archival Emerald        (#2A6F4E) — Income, positive cashflow, reconciliation
├── Archival Crimson        (#B83A3A) — Expenses, liabilities, sealing stamps
└── Archival Slate Navy     (#235789) — Fund transfers, monthly chapters
```

---

## Typography

SpendIt pairs four distinct typographic voices to establish clear hierarchy and physical realism:

| Role | Font Family | Usage | Characteristics |
| :--- | :--- | :--- | :--- |
| **Display / Headlines** | `Newsreader`, `Playfair Display`, `Georgia`, serif | Folio headers, day of week, chapter titles | Elegant, editorial, literary weight with tight tracking |
| **Monospace / Numbers** | `Space Mono`, `JetBrains Mono`, monospace | Currency figures, timestamps, tabular calculations | Monospaced tabular alignment, audited feel |
| **Handwritten Marginalia** | `Caveat`, `Kalam`, cursive | Daily reflections, spend context, margin notes | Warm, organic, casual slant and authentic pen stroke |
| **UI Body / Labels** | `Plus Jakarta Sans`, `Inter`, sans-serif | Controls, modal inputs, button text | High legibility at small sizes (11px–13px) |

---

## Layout

1. **Daily Journal View (`DiaryView.tsx`)**:
   - Central Smyth-sewn ledger sheet with red ribbon bookmark anchored on "Today".
   - Ruled ledger transaction rows with timestamps, category chips, and inline margin reflections.
   - Daily margin reflection card (mood, weather, personal notes) and End-of-Day reconciliation seal.
2. **Monthly Chapter Folio (`ChaptersView.tsx`)**:
   - 31-day visual spending heatmap with ink intensity levels.
   - Safe-to-Spend Compass showing daily discretionary allowance and runway remaining.
   - Category budget envelopes and recurring commitment radar.
3. **Accounts & Vaults Register (`AccountsView.tsx`)**:
   - Real-time balance cards categorized by Cash, Bank, Credit Card, and Sinking Reserves.
   - Fast inter-account fund transfers and full edit/delete capabilities.
4. **Money Jars / Sinking Funds (`GoalsView.tsx`)**:
   - Visual apothecary jars with liquid fill progress gauges and confetti celebration upon deposit.
5. **Printable Archival PDF Engine (`PrintableJournalModal.tsx`)**:
   - Isolated vector render engine producing full A4/Letter pages without screen UI artifacts.

---

## Elevation & Depth

- **Tactile Paper Shadows**: Layered organic warm shadows (`box-shadow: 0 4px 20px -2px rgba(44, 34, 20, 0.08)`).
- **Embossed Paper Insets**: Subtle inner shadow on text input fields simulating pen impressions on thick rag paper.
- **Rubber Stamps**: Dashed border badges with slight rotations (`transform: rotate(-3deg)`) and ink mask opacity simulating rubber stamp marks.
- **Bookmark Ribbons**: Top-anchored ribbons with polygon clip paths (`clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)`).

---

## Shapes

- **Folio Sheets & Cards**: Gentle rounded corners (`rounded-2xl` / `16px`) with 2px parchment borders (`border-paper-300`).
- **Interactive Buttons**: Crisp `rounded-lg` (`8px`–`10px`) with subtle tactile press feedback (`active:scale-95`).
- **Category & Account Chips**: Micro rounded pills (`rounded-md` / `6px`) with 15% opacity color tint backgrounds.

---

## Components

### 1. Shorthand Journal Entry Modal (`QuickAddModal.tsx`)
- Intelligent shorthand parser recognizing Indian terminology (`"chai 15 cash"`, `"kirana 450 upi"`, `"rent 20k hdfc"`).
- Real-time ledger entry preview displaying parsed type, amount, account, and category.
- Dynamic Recurring Spends & Daily Habit chips for 1-tap logging.

### 2. Ruled Ledger Transaction Row (`TransactionRow.tsx`)
- Verification circle checkbox for physical reconciliation.
- Description and inline handwritten margin note (`✎ "..."`).
- Tabular monospaced amount with color coding (Green for inflow, Red for expense, Blue for transfer).
- Edit & Delete actions with safety confirmation dialogs.

### 3. Sinking Fund Money Jar (`GoalsView.tsx`)
- Visual apothecary jar container with fill gauge percentage.
- One-tap "Feed Jar" allocation flow transferring money from an account directly into the goal.
- Confetti celebratory animation upon milestone progress.

### 4. End-of-Day Summary & Seal (`EndOfDaySummary.tsx`)
- Summary vitals of daily income, outflow, and net balance.
- Interactive wax seal button (`[✓ SEAL THIS FOLIO PAGE]`) that locks the day's record with a red stamp.

---

## Do's and Don'ts

### Do:
- **Preserve the Physical Ledger Aesthetic**: Use warm paper tones, serif typography, and monospaced financial tables.
- **Keep Language Natural and Tactile**: Use terms like *"Journal Entry"*, *"Ledger"*, *"Folio"*, *"Sinking Jars"*, and *"Archival Register"*.
- **Maintain Accounting Rigor**: Balances must always derive from verified ledger transactions.
- **Design for Indian Financial Context**: Default to Indian Rupee (`₹` INR), UPI, GPay, Paytm, and local spend habits.

### Don't:
- **No SaaS Dashboard Clichés**: Avoid neon purple on dark backgrounds, generic SaaS blue, and floating gradient buttons.
- **No Software / Database Jargon**: Never expose technical terms like *"PostgreSQL"*, *"SQL"*, *"Database"*, *"CRUD"*, *"API"*, or *"REST"* in user-facing UI copy.
- **No Floating Modal Print Glitches**: Ensure printable documents render edge-to-edge as full vector pages without dialog frames or backdrops.
- **No Generic Synthetic Mock Data**: Every ledger starts clean with real empty states and authentic user records.
