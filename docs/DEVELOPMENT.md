# 🛠️ SpendIt Developer Manual & Architecture Guide

Welcome to the **SpendIt** technical developer documentation. This guide details the software architecture, runtime lifecycle, local SQLite database schema, accounting engine math, natural language parsing pipeline, and instructions for building desktop and mobile binaries.

---

## 📑 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Codebase Map & Directory Layout](#2-codebase-map--directory-layout)
3. [Prerequisites & Environment Setup](#3-prerequisites--environment-setup)
4. [Development & Build Workflows](#4-development--build-workflows)
5. [Database Architecture & SQLite Schema](#5-database-architecture--sqlite-schema)
6. [Core Technical Subsystems](#6-core-technical-subsystems)
   - [A. Derived Double-Entry Accounting Engine](#a-derived-double-entry-accounting-engine)
   - [B. Natural Language Parsing Pipeline](#b-natural-language-parsing-pipeline)
   - [C. Web Audio Oscillator Synthesis Engine](#c-web-audio-oscillator-synthesis-engine)
   - [D. Isolated Archival Print Vector Engine](#d-isolated-archival-print-vector-engine)
   - [E. Native Notifications & GitHub Releases Updater](#e-native-notifications--github-releases-updater)
7. [Upcoming Mobile Architecture (Tauri v2 Mobile)](#7-upcoming-mobile-architecture-tauri-v2-mobile)
8. [Design System & Coding Guidelines](#8-design-system--coding-guidelines)
9. [Contributing & Pull Request Workflow](#9-contributing--pull-request-workflow)

---

## 1. Architecture Overview

SpendIt is built as a **local-first desktop and web application** powered by **Tauri v2**, **React 18**, **TypeScript**, and **SQLite**.

```mermaid
graph TD
    subgraph UI Layer [React 18 + Vite + TailwindCSS]
        App[App Shell & Navigation]
        Context[FinanceContext Provider]
        Diary[Today's Diary Folio]
        NLP[Quick Add NLP Modal]
        Chapters[Monthly Chapters & Heatmap]
        Accounts[Accounts & Vaults]
        Jars[Apothecary Money Jars]
        Simulator[What-If Simulator]
    end

    subgraph Core Logic [TypeScript Engines]
        Accounting[accounting.ts: Derived Balances & Safe-to-Spend]
        Parser[nlpParser.ts: Vernacular NLP Tokenizer]
        Haptics[audioHaptics.ts: Web Audio Oscillators]
        Printer[pdfPrinter.ts: Vector Print Renderer]
        Updater[updater.ts: GitHub Releases Semver]
    end

    subgraph Bridge & Runtime [Tauri v2 Rust Core]
        IPC[Tauri IPC Bridge / Rust Plugins]
        PluginSQL[tauri-plugin-sql]
        PluginNotification[tauri-plugin-notification]
        PluginUpdater[tauri-plugin-updater]
        PluginFS[tauri-plugin-fs / opener]
    end

    subgraph Local Storage [Device Filesystem]
        SQLite[(spendit.db SQLite File)]
        Session[(sessionStorage Drafts)]
        LocalConfig[(localStorage Haptics/Theme)]
    end

    App --> Context
    Context --> CoreLogic
    Context --> Bridge
    Bridge --> SQLite
    UI Layer --> Haptics
```

### Key Architectural Tenets:
1. **Local-First & Zero Telemetry**: Every transaction, note, and goal is stored locally on the user's hard drive in `spendit.db`. No network requests are made except for checking optional GitHub Releases updates.
2. **Derived Accounting Truth**: Balances are not stored as mutable counters. They are computed dynamically from `initial_balance` + verifiable transaction deltas.
3. **Zero Audio Assets**: Haptics and sound effects are synthesized on-the-fly using the Web Audio API oscillator nodes, keeping the binary ultra-lightweight and offline-resilient.

---

## 2. Codebase Map & Directory Layout

```
spendit/
├── index.html                  # Main web entry point with Google Fonts (Newsreader, Space Mono, Caveat)
├── package.json                # Project dependencies and lifecycle scripts
├── tsconfig.json               # Strict TypeScript configuration
├── vite.config.ts              # Vite bundler configuration (port 3000)
├── tailwind.config.js          # Custom theme tokens (parchment, mineral inks, ledger shadows)
├── DESIGN.md                   # Formal Design System specification
├── PRODUCT.md                  # Product requirement specification & philosophy
├── docs/                       # Developer & architecture documentation
│   └── DEVELOPMENT.md          # This file
│
├── src/                        # Frontend Application Source (React 18 + TS)
│   ├── main.tsx                # React DOM root mounting
│   ├── App.tsx                 # Top-level view routing & modal coordinators
│   ├── index.css               # Global typography, ledger ruling lines, scrollbar styling
│   │
│   ├── context/
│   │   └── FinanceContext.tsx   # Global finance state provider, shortcuts, and DB synchronization
│   │
│   ├── types/
│   │   └── index.ts            # Core TypeScript models (Transaction, Account, Category, DailyNote, Goal)
│   │
│   ├── lib/                    # Computational Engines & Core Utilities
│   │   ├── db.ts               # SQLite table creation, PRAGMA setup, and database singleton
│   │   ├── api.ts              # Data Access Layer (CRUD, backup export/import, suggestions)
│   │   ├── accounting.ts       # Derived balance math, 7-day trailing averages, Safe-to-Spend Compass
│   │   ├── nlpParser.ts        # Natural language tokenizer, time slot classifier, bracket parser
│   │   ├── audioHaptics.ts     # Synthesized Web Audio API sound effects (Wax seal, page flip, coin chime)
│   │   ├── pdfPrinter.ts       # A4/Letter vector print HTML generator
│   │   ├── notifications.ts    # Tauri native desktop toast notifications
│   │   ├── updater.ts          # Tauri v2 updater integration with GitHub Releases
│   │   └── utils.ts            # Formatting (₹ INR, dates, day-of-year, CSV export)
│   │
│   └── components/             # React UI Folios & Components
│       ├── common/             # Navigation, QuickAddModal, ReceiptModal, Onboarding, UpdateModal
│       ├── diary/              # DiaryView, TransactionRow, DailyNotes, EndOfDaySummary
│       ├── accounts/           # AccountsView, TransferModal
│       ├── chapters/           # ChaptersView, MoneyHeatmap
│       ├── goals/              # GoalsView (Apothecary Money Jars with confetti)
│       ├── simulator/          # SimulatorView (What-If forecasting sliders)
│       ├── search/             # SearchView (Multi-criteria filter & receipt gallery)
│       └── settings/           # SettingsView (Data export/import, haptics, theme, update checker)
│
└── src-tauri/                  # Desktop Runtime (Tauri v2 + Rust)
    ├── Cargo.toml              # Rust crate dependencies (tauri-plugin-sql, updater, notifications)
    ├── tauri.conf.json         # Window definitions, permissions, update endpoints, bundle icons
    ├── build.rs                # Tauri build orchestrator
    └── src/
        ├── lib.rs              # Tauri plugin registration and mobile/desktop entry
        └── main.rs             # Application runner
```

---

## 3. Prerequisites & Environment Setup

To develop and build SpendIt locally, ensure your system has the following installed:

### 1. Node.js
- **Node.js**: `v18.0.0` or later (LTS recommended)
- **npm**: `v9.0.0` or later

### 2. Rust Toolchain (for Tauri v2 Desktop)
- **Rust**: `1.77.2` or later. Install via [rustup.rs](https://rustup.rs/):
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

### 3. OS-Specific Build Dependencies
- **Windows**: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) or Visual Studio with "Desktop development with C++" workload, plus the WebView2 Runtime (pre-installed on Windows 10/11).
- **macOS**: Xcode Command Line Tools: `xcode-select --install`.
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt-get update
  sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
  ```

---

## 4. Development & Build Workflows

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Desktop Development Mode (Tauri + Hot-Reload)
Launches the Vite dev server at `http://127.0.0.1:3000` and wraps it in a native Tauri desktop window:
```bash
npm run desktop:dev
```

### 3. Run Web Client Only (Browser Mode)
```bash
npm run client
```

### 4. Build Production Desktop Installers
Compiles optimized TypeScript, bundles assets with Vite, and invokes `cargo tauri build` to output `.msi`, `.exe`, `.dmg`, or `.deb` packages:
```bash
npm run desktop:build
```
*Compiled binaries will be generated under `src-tauri/target/release/bundle/`.*

---

## 5. Database Architecture & SQLite Schema

SpendIt initializes and manages an embedded SQLite database (`spendit.db`) via `@tauri-apps/plugin-sql`.

### DDL Schema Initialization (`src/lib/db.ts`)

```sql
PRAGMA foreign_keys = ON;

-- 1. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                         -- 'cash' | 'bank' | 'credit' | 'savings' | 'investment'
  balance REAL NOT NULL DEFAULT 0.00,
  initial_balance REAL NOT NULL DEFAULT 0.00,
  color TEXT NOT NULL DEFAULT '#8C6D37',
  icon TEXT NOT NULL DEFAULT 'Banknote',
  account_number_masked TEXT,
  institution TEXT,
  created_at INTEGER NOT NULL
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#C07D2B',
  monthly_budget REAL DEFAULT 0.00,
  created_at INTEGER NOT NULL
);

-- 3. Transactions Table (Immutable Ledger Events)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,                         -- 'YYYY-MM-DD'
  time TEXT NOT NULL,                         -- 'HH:mm' (24h)
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,                         -- 'expense' | 'income' | 'transfer'
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  destination_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  tags TEXT DEFAULT '[]',                     -- JSON Array of string tags e.g. ["#kirana", "#chai"]
  notes TEXT,                                 -- Handwritten marginalia
  receipt_url TEXT,                           -- Base64 or local image file URI
  reconciled INTEGER DEFAULT 0,               -- 0 = unverified, 1 = verified/reconciled
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- 4. Daily Notes & Reflections Table
CREATE TABLE IF NOT EXISTS daily_notes (
  date TEXT PRIMARY KEY,                      -- 'YYYY-MM-DD'
  mood TEXT DEFAULT 'peaceful',               -- 'peaceful' | 'focused' | 'frugal' | 'celebratory' | 'stressed' | 'neutral'
  weather TEXT DEFAULT 'sunny',               -- 'sunny' | 'rainy' | 'cloudy' | 'snowy'
  location TEXT,
  reflection TEXT,
  sealed INTEGER DEFAULT 0,                   -- 1 = End-of-day wax seal stamped
  updated_at INTEGER NOT NULL
);

-- 5. Sinking Funds & Money Goals Table
CREATE TABLE IF NOT EXISTS money_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0.00,
  target_date TEXT NOT NULL,                  -- 'YYYY-MM-DD'
  category TEXT NOT NULL DEFAULT 'Savings',
  color TEXT NOT NULL DEFAULT '#C07D2B',
  icon TEXT NOT NULL DEFAULT 'Target',
  notes TEXT,
  created_at INTEGER NOT NULL
);

-- 6. Recurring Commitments Table
CREATE TABLE IF NOT EXISTS recurring_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'monthly',  -- 'weekly' | 'monthly' | 'yearly'
  day_of_month INTEGER NOT NULL DEFAULT 1,
  last_logged_date TEXT,
  created_at INTEGER NOT NULL
);
```

---

## 6. Core Technical Subsystems

### A. Derived Double-Entry Accounting Engine (`src/lib/accounting.ts`)
SpendIt derives all real-time balances mathematically rather than maintaining unstable counter states:

```typescript
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Account[] {
  return accounts.map(acc => {
    let currentBalance = acc.initialBalance;

    for (const t of transactions) {
      if (t.type === 'expense' && t.accountId === acc.id) {
        currentBalance -= t.amount;
      } else if (t.type === 'income' && t.accountId === acc.id) {
        currentBalance += t.amount;
      } else if (t.type === 'transfer') {
        if (t.accountId === acc.id) currentBalance -= t.amount;
        if (t.destinationAccountId === acc.id) currentBalance += t.amount;
      }
    }

    return {
      ...acc,
      balance: Math.round(currentBalance * 100) / 100,
    };
  });
}
```

#### Safe-to-Spend Compass Algorithm
Calculates the remaining daily burn allowance:
$$ \text{Discretionary Budget} = \max(0, \text{Income} - \text{Fixed Bills} - \text{Savings Goals}) $$
$$ \text{Safe Daily Allowance} = \frac{\text{Discretionary Budget} - \text{Spent So Far}}{\text{Days Remaining in Month}} $$

---

### B. Natural Language Parsing Pipeline (`src/lib/nlpParser.ts`)
The NLP parser extracts structured financial parameters from raw unstructured text input in real-time:
1. **Bracketed Marginalia**: `[split with rohit]` or `(for client meeting)` → extracted into `notes`.
2. **Hashtags**: `#chai #kirana #travel` → extracted into `tags[]`.
3. **Exact Time & Period Classification**:
   - `12:23 am`, `8:30pm`, `@14:30` → converts to `HH:mm` format.
   - Named time tokens (`morning`, `noon`, `evening`, `night`) → classifies into standard time slots.
4. **Amount Tokenization**: Regex matches `₹150`, `15k`, `450.50`, etc.
5. **Account & Category Resolution**: Fuzzy matching against user accounts and categories with Indian banking vernacular (`upi`, `gpay`, `paytm`, `hdfc`, `sbi`, `cash`).

---

### C. Web Audio Oscillator Synthesis Engine (`src/lib/audioHaptics.ts`)
To maintain zero dependencies and zero network lag, sound effects are generated via the browser's native `AudioContext`:

| Sound | Oscillator Configuration | Decay Envelope |
| :--- | :--- | :--- |
| **Wax Seal Stamp** | Sine wave starting at 120 Hz dropping to 30 Hz | Fast exponential decay over 0.22s with muffled low-pass filter |
| **Page Turn** | Band-pass filtered white noise buffer | Linear ramp up and down over 0.08s |
| **Pen Nib Click** | Triangle wave burst at 2200 Hz | Ultra-short decay over 0.015s |
| **Jar Coin Drop** | Dual harmonic sine waves at 1760 Hz & 3520 Hz | Ringing exponential decay over 0.45s |

---

### D. Isolated Archival Print Vector Engine (`src/lib/pdfPrinter.ts`)
Generates standalone A4 / Letter printable HTML documents:
- Eliminates app frame, navigation bars, and inputs.
- Applies archival serif fonts and high-contrast ledger lines (`#191C1A` on `#FFFFFF`).
- Opens the system print dialog in an isolated temporary iframe.

---

### E. Native Notifications & GitHub Releases Updater (`src/lib/updater.ts` & `notifications.ts`)
- **Native Notifications**: Communicates with the OS notification daemon (Windows Action Center, macOS Notification Center) via `@tauri-apps/plugin-notification`.
- **Auto-Updater**: Compares `CURRENT_APP_VERSION` against GitHub Releases JSON using `semver`.
  - Minor/patch bumps → downloaded and installed in-app as an OTA update.
  - Major upgrades (e.g. `v1.x` → `v2.x`) → opens the GitHub Release download page in the default browser.

---

## 7. Upcoming Mobile Architecture (Tauri v2 Mobile)

Tauri v2 provides first-class support for compiling to **Android (APK / AAB)** and **iOS (IPA)** from the same codebase:

### Mobile Porting Blueprint:
1. **Responsive Viewport**: The UI is styled with mobile-first Tailwind utilities (`max-w-4xl`, responsive bottom navigation bar, touch-friendly `44px` minimum hit targets).
2. **Hardware Haptic Feedback**: Bridge `@tauri-apps/plugin-haptics` on mobile to complement the Web Audio sound effects.
3. **Camera Receipt Scanning**: Integrate native camera capture for attaching receipts directly to journal entries.
4. **Android / iOS Initialization**:
   ```bash
   # Initialize Android project
   npm run tauri android init

   # Initialize iOS project (macOS required)
   npm run tauri ios init
   ```

---

## 8. Design System & Coding Guidelines

Refer to [`DESIGN.md`](../DESIGN.md) for full design system details. When authoring code or creating new folios, adhere to these principles:

1. **No Software Jargon in UI Copy**: Never expose terms like *"SQL"*, *"Database"*, *"CRUD"*, *"REST"*, or *"Postgres"* to the user. Use tactile terms: *"Ledger Folio"*, *"Journal Entry"*, *"Archival Register"*, *"Sinking Jar"*, *"Seal Page"*.
2. **Respect Physical Materiality**: Use warm paper backgrounds (`bg-paper-50`, `bg-paper-100`), monospaced figures for currency tables (`font-mono`), and serif headlines (`font-serif`).
3. **Preserve Accounting Invariants**: Never mutate account balances directly. Always create corresponding ledger transactions.

---

## 9. Contributing & Pull Request Workflow

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/onenonlyaman/spendit.git
   cd spendit
   ```
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Verify Types and Build**:
   ```bash
   npm run build
   ```
4. **Submit Pull Request**:
   - Provide a clear summary of changes and reference relevant issues.
   - Include before/after screenshots for visual UI changes.

---

<div align="center">
  <p>For questions or architecture discussions, visit <a href="https://github.com/onenonlyaman/spendit/issues">GitHub Issues</a>.</p>
</div>
