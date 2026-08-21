# 🛠️ SpendIt Developer Manual & Architecture Guide

Welcome to the **SpendIt** technical developer documentation. This guide details the software architecture, runtime lifecycle, local SQLite database schema, accounting engine math, liquid glass UI subsystem, natural language parsing pipeline, and instructions for building desktop and mobile binaries.

---

## 📑 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Codebase Map & Directory Layout](#2-codebase-map--directory-layout)
3. [Prerequisites & Environment Setup](#3-prerequisites--environment-setup)
4. [Development & Build Workflows](#4-development--build-workflows)
5. [Database Architecture & SQLite Schema](#5-database-architecture--sqlite-schema)
6. [Core Technical Subsystems](#6-core-technical-subsystems)
   - [A. Liquid Glass & Motion Architecture](#a-liquid-glass--motion-architecture)
   - [B. Derived Double-Entry Accounting Engine](#b-derived-double-entry-accounting-engine)
   - [C. Natural Language Parsing Pipeline](#c-natural-language-parsing-pipeline)
   - [D. Web Audio Oscillator Synthesis Engine](#d-web-audio-oscillator-synthesis-engine)
   - [E. Isolated Archival Print Vector Engine](#e-isolated-archival-print-vector-engine)
   - [F. Native Notifications & GitHub Releases Updater](#f-native-notifications--github-releases-updater)
7. [Multi-Platform & Mobile Architecture (Tauri v2 Desktop & Android)](#7-multi-platform--mobile-architecture-tauri-v2-desktop--android)
8. [Design System & Coding Guidelines](#8-design-system--coding-guidelines)
9. [Contributing & Pull Request Workflow](#9-contributing--pull-request-workflow)

---

## 1. Architecture Overview

SpendIt is built as a **local-first desktop and mobile application** powered by **Tauri v2**, **React 18**, **TypeScript**, **Framer Motion**, and **SQLite**.

```mermaid
graph TD
    subgraph UI Layer [React 18 + Vite + TailwindCSS + Motion]
        App[App Shell & Ambient Glass Mesh]
        Nav[Floating Glass Navigation & Dock]
        Context[FinanceContext Provider]
        ContextMenu[Custom Artisanal Context Menu]
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
        LocalConfig[(localStorage Haptics/Theme/PerfMode)]
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
3. **Liquid Glass Materiality**: Frosted translucent surfaces with specular highlights and ambient atmospheric lighting meshes.
4. **Zero Audio Assets**: Haptics and sound effects are synthesized on-the-fly using the Web Audio API oscillator nodes, keeping the binary ultra-lightweight and offline-resilient.

---

## 2. Codebase Map & Directory Layout

```
spendit/
├── index.html                  # Main web entry point with Google Fonts (Newsreader, Space Mono, Caveat)
├── package.json                # Project dependencies (v1.1.0, motion, tauri plugins)
├── tsconfig.json               # Strict TypeScript configuration
├── vite.config.ts              # Vite bundler configuration (port 3000)
├── tailwind.config.js          # Custom theme tokens (Apple colors, parchment, mineral inks)
├── DESIGN.md                   # Formal Design System specification
├── PRODUCT.md                  # Product requirement specification & philosophy
├── assets/                     # Official brand assets (logo.png)
├── docs/                       # Developer & architecture documentation
│   └── DEVELOPMENT.md          # This file
│
├── src/                        # Frontend Application Source (React 18 + TS)
│   ├── main.tsx                # React DOM root mounting
│   ├── App.tsx                 # Top-level view routing, AmbientGlassMesh & modal coordinators
│   ├── index.css               # Global typography, ledger ruling lines, scrollbar styling
│   │
│   ├── context/
│   │   ├── FinanceContext.tsx   # Global finance state provider, shortcuts, and DB synchronization
│   │   └── ContextMenuContext.tsx # Global custom right-click context menu state
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
│       ├── ui/                 # Reusable UI primitives (GlassSurface, AppleSwitch, GooeyInput)
│       ├── common/             # Navigation, QuickAddModal, CustomContextMenu, ReceiptModal, Onboarding, UpdateModal
│       ├── diary/              # DiaryView, TransactionRow, DailyNotes, EndOfDaySummary
│       ├── accounts/           # AccountsView, TransferModal
│       ├── chapters/           # ChaptersView, MoneyHeatmap
│       ├── goals/              # GoalsView (Apothecary Money Jars with confetti)
│       ├── simulator/          # SimulatorView (What-If forecasting sliders)
│       ├── search/             # SearchView (Multi-criteria filter & receipt gallery)
│       └── settings/           # SettingsView (Data export/import, haptics, theme, performance mode)
│
└── src-tauri/                  # Desktop & Mobile Runtime (Tauri v2 + Rust)
    ├── Cargo.toml              # Rust crate dependencies (tauri-plugin-sql, updater, notifications)
    ├── tauri.conf.json         # Window definitions, permissions, update endpoints, bundle icons
    ├── build.rs                # Tauri build orchestrator
    ├── gen/android/            # Generated Android Studio project
    └── src/
        ├── lib.rs              # Tauri plugin registration and mobile/desktop entry
        └── main.rs             # Application runner
```

---

## 3. Prerequisites & Environment Setup

To develop and build SpendIt locally, ensure your system has the following installed:

### 1. Node.js
- **Node.js**: `v18.0.0` or later (Node 22 LTS recommended)
- **npm**: `v9.0.0` or later

### 2. Rust Toolchain (for Tauri v2 Desktop & Mobile)
- **Rust**: `1.77.2` or later. Install via [rustup.rs](https://rustup.rs/):
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

### 3. Android SDK (for Mobile Builds)
- **Android Studio** with Android SDK Platform 34+, Android SDK Build-Tools, and NDK.
- Target Rust toolchains: `aarch64-linux-android`, `armv7-linux-androideabi`, `i686-linux-android`, `x86_64-linux-android`.

### 4. OS-Specific Desktop Build Dependencies
- **Windows**: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with C++ workload and WebView2 Runtime.
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

### 5. Build Android APK
```bash
npm run tauri android build -- --apk
```

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

### A. Liquid Glass & Motion Architecture
SpendIt v1.1 incorporates modern Apple-inspired glassmorphism and spring physics:
- **`GlassSurface` (`src/components/ui/GlassSurface.tsx`)**: Translucent SVG displacement and backdrop blur component simulating optical refraction, surface highlights, and dispersion.
- **`AmbientGlassMesh` (`src/App.tsx`)**: Atmospheric background lighting mesh that dynamically projects luminous color orbs behind the glass surfaces.
- **Directional Page Variants (`motion/react`)**: Direction-aware horizontal sliding animations when flipping through ledger leaves.
- **Adaptive Performance Mode**: Disables ambient blur filters and heavy spring calculations when running on battery or lower-powered hardware.

---

### B. Derived Double-Entry Accounting Engine (`src/lib/accounting.ts`)
SpendIt derives all real-time balances mathematically:

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

### C. Natural Language Parsing Pipeline (`src/lib/nlpParser.ts`)
The NLP parser extracts structured parameters from raw unstructured text:
1. **Bracketed Marginalia**: `[split with rohit]` → extracted into `notes`.
2. **Hashtags**: `#chai #kirana #travel` → extracted into `tags[]`.
3. **Exact Time & Period Classification**: `12:23 am`, `8:30pm`, `@14:30`, or period keywords (`morning`, `noon`, `evening`, `night`).
4. **Amount Tokenization**: Matches currency amounts and Indian numbering (`15k`, `450.50`).
5. **Account & Category Resolution**: Fuzzy matching against user accounts and categories (`upi`, `gpay`, `hdfc`, `cash`).

---

### D. Web Audio Oscillator Synthesis Engine (`src/lib/audioHaptics.ts`)
Sound effects are synthesized dynamically via the native browser `AudioContext`:

| Sound | Oscillator Configuration | Decay Envelope |
| :--- | :--- | :--- |
| **Wax Seal Stamp** | Sine wave starting at 120 Hz dropping to 30 Hz | Fast exponential decay over 0.22s with muffled low-pass filter |
| **Page Turn** | Band-pass filtered white noise buffer | Linear ramp up and down over 0.08s |
| **Pen Nib Click** | Triangle wave burst at 2200 Hz | Ultra-short decay over 0.015s |
| **Jar Coin Drop** | Dual harmonic sine waves at 1760 Hz & 3520 Hz | Ringing exponential decay over 0.45s |

---

### E. Isolated Archival Print Vector Engine (`src/lib/pdfPrinter.ts`)
Generates standalone A4 / Letter printable HTML documents:
- Eliminates app frame, navigation bars, and inputs.
- Applies archival serif fonts and high-contrast ledger lines (`#191C1A` on `#FFFFFF`).
- Opens the system print dialog in an isolated temporary iframe.

---

### F. Native Notifications & GitHub Releases Updater (`src/lib/updater.ts` & `notifications.ts`)
- **Native Notifications**: Communicates with OS notification daemons via `@tauri-apps/plugin-notification`.
- **Auto-Updater**: Compares `CURRENT_APP_VERSION` against GitHub Releases JSON using `semver`.
  - Minor/patch bumps → downloaded and installed in-app as an OTA update.
  - Major upgrades → opens the GitHub Release download page.

---

## 7. Multi-Platform & Mobile Architecture (Tauri v2 Desktop & Android)

SpendIt v1.1 supports cross-compilation across **Desktop (Windows, macOS, Linux)** and **Mobile (Android APK)**:

### Mobile Porting Features:
1. **Floating Glass Dock**: Touch-friendly bottom navigation bar with Apple-style fluid tabs and quick-add trigger.
2. **Android Keystore Signing**: CI/CD automated signing with environment-injected release keystores.
3. **Touch Ergonomics**: Minimum 44px hit targets and active touch press scaling across all cards and buttons.

---

## 8. Design System & Coding Guidelines

Refer to [`DESIGN.md`](../DESIGN.md) for full design system details. When authoring code, adhere to these principles:

1. **No Software Jargon in UI Copy**: Never expose terms like *"SQL"*, *"Database"*, *"CRUD"*, *"REST"*, or *"Postgres"* to the user. Use tactile terms: *"Ledger Folio"*, *"Journal Entry"*, *"Archival Register"*, *"Sinking Jar"*, *"Seal Page"*.
2. **Respect Physical Materiality & Glass Translucency**: Pair warm ivory surfaces with subtle frosted glass containers.
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
