# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Tauri v2 desktop application (primary shipping target) wrapping a Vite + React 18 + TypeScript + TailwindCSS front end with custom ledger CSS tokens. Persistence is a local SQLite file (`spendit.db`) via `@tauri-apps/plugin-sql`, opened and schema-migrated in `src/lib/db.ts`; all data access flows through `src/lib/api.ts`. Platform is recorded as `web` because the UI runs in a Tauri webview and follows web design language, not native iOS/Android conventions.

The `server/` directory (Express + Postgres, port 5001) is legacy: no code under `src/` calls it. Treat it as dead unless the user revives it as a deliberate sync tier.

## Users

- **Primary User**: Individuals seeking mindful, deliberate personal finance tracking who find conventional fintech SaaS dashboards clinical, sterile, overwhelming, or disconnected from daily spending reality.
- **User Situation**: Everyday personal spending, journaling daily expenses on-the-go or during an evening financial wind-down ritual, reviewing daily cash flow, managing account balances, and planning life savings goals.
- **Job to be Done**: Capture daily transactions effortlessly with natural language speed, maintain ledger-grade accounting accuracy across multiple accounts, and reflect on financial health through a tactile, warm, handwritten-diary aesthetic that encourages mindfulness rather than detached automation or predatory gamification.

## Product Purpose

SpendIt bridges the warmth, mindfulness, and intentionality of a physical paper ledger / bullet journal with the computing power of modern digital personal finance (natural language parsing, instant reconciliation, automated math, category heatmaps, safe-to-spend calculators, and scenario simulation). It eliminates fintech dashboard fatigue by treating personal finance as a personal narrative and daily journaling practice.

## Positioning

Unlike traditional banking dashboards and fintech SaaS apps (which push automated account scrapers, noisy notifications, impersonal charts, and upsells), SpendIt positions personal finance as an intimate daily journal. It pairs deliberate, friction-free manual & natural-language logging with rigorous double-entry accounting integrity, warm paper-and-ink materiality, and zero tracking/cloud lock-in.

## Operating Context

- **Daily Reflection & Logging Ritual**: Quick on-the-spot capture ("chai 15 cash", "groceries 84.50 card #supplies") and an end-of-day ledger closure review comparing daily spend against 7-day rolling baselines.
- **Physical Notebook Metaphor**: Pages, margins, daily notes, ink stamps, textured paper backgrounds, handwritten callouts, bookmark ribbons, and monthly "Chapters".
- **Environment**: Installed Tauri desktop app on Windows (built via `npm run desktop:build`, x86_64-pc-windows-gnu), with full offline persistence, instant responsiveness, privacy mode (obfuscating balances in public), and keyboard-first power navigation. `npm run client` serves the same UI in a plain browser for development.
- **Indian Financial Context**: Indian Rupee (`₹` INR) is the default currency, with UPI, GPay, and Paytm as first-class account and payment-method concepts, and local spend habits (chai, kirana, autos) as the vocabulary of everyday entries.

## Capabilities and Constraints

### Capabilities
- **Natural Language Parsing**: Fast unstructured string parsing extracting amount, currency, merchant/description, account, category tags, and notes.
- **Diary-First Architecture**: Daily diary pages with page metadata (weather/mood/location tags, daily financial reflections, end-of-day summary balance).
- **Multi-Account & Real-time Balance Engine**: Cash, Bank Accounts, Credit Cards, Digital Wallets, and Vaults/Jars with double-entry reconciliation.
- **Financial Calendar & Monthly Chapters**: Day-by-day money heatmaps, no-spend day stamps, monthly overview chapters, and milestone markers.
- **Analytics & Predictive Intelligence**: Safe-to-Spend calculations, monthly allowance runways, recurring commitment schedules, and what-if scenario simulators.
- **Receipts & Attachments**: Local image/receipt storage tied to journal entries.
- **Offline-First & Data Ownership**: 100% local storage in an on-device SQLite file, encrypted backups, JSON/CSV ledger export/import. No cloud account, no telemetry, no third-party scraping.
- **Custom Reminders**: User-defined reminders for bills and recurring commitments, delivered through the OS via `@tauri-apps/plugin-notification` (shipped in v1.1.2).
- **Versioned Release & Self-Update**: Semver-tracked desktop releases with in-app update checks through `@tauri-apps/plugin-updater` (`src/lib/updater.ts`) — the one network call the product makes.

### Constraints
- **Zero Predatory Gamification**: No pushy streaks or casino-style animations that distort spending psychology.
- **Restraint Over Decoration**: No ornament that does not carry information. No ambient gradient meshes, decorative glass, or bento-box card grids standing in for structure. See DESIGN.md for the enforced list.
- **Accounting Rigor**: Transactions remain immutable ledger events; balances are derived truths.
- **Update Channel Is the Only Network Dependency**: Everything except the updater check must work with no connectivity; an offline user loses nothing but update notices.
- **Desktop-First Layout Reality**: Design for an installed desktop window first. Responsive behavior is still expected, but mobile-web is not a shipping target.

## Brand Commitments

- **Tone & Voice**: Calm, precise, trustworthy, plain-spoken. Says what happened and what the user can do about it; never chirpy, never alarming about ordinary spending.
- **Visual Anchor**: Apple-esque desktop restraint — "The Quiet Instrument". iOS/macOS materials, inset-grouped lists, system accent semantics, Plus Jakarta Sans, true-black dark mode, tabular numerals. DESIGN.md is the normative record.
- **Retired Direction**: An earlier warm-paper / handwritten-diary aesthetic (ruled paper, wax seals, Caveat/Kalam handwriting, `archival-*` palette) was deliberately replaced. Product nouns like "folio", "ledger", and "jars" survive as vocabulary; the materials do not. Do not reintroduce them.

## Evidence on Hand

- Core requirements and functional roadmap defined in the user brief.
- Initial product specification document establishing ledger aesthetics and digital-accounting duality.
- Working implementation as evidence: `src/lib/db.ts` (SQLite schema), `src/lib/api.ts` (data layer), `src/context/FinanceContext.tsx` (state), `src/lib/nlpParser.ts` (natural-language capture), `src/lib/notifications.ts`, `src/lib/updater.ts`.
- `DESIGN.md` and `docs/` record the incumbent visual system; `server/` is legacy code, not evidence of product direction.
- No testimonials, customers, benchmarks, pricing, or press exist. Future work must not fabricate them.

## Product Principles

1. **Tactile Materiality Meets Computational Rigor**: The interface feels like high-grade stationery, but behaves with zero-latency computational precision and accounting truth.
2. **Frictionless Capture, Mindful Reflection**: Entry takes 2 seconds with natural language; review invites slow, conscious financial awareness.
3. **Data Sovereignty & Privacy by Default**: Financial data belongs exclusively to the user—offline-first, zero third-party telemetry, local ledger storage.
4. **Deliberate Restraint Over SaaS Noise**: No spammy notifications, no unsolicited financial product recommendations, and no decorative fluff that doesn't serve financial clarity.

## Accessibility & Inclusion

- WCAG AA contrast as the enforced floor for all text and meaningful UI, with a 13px minimum type size.
- Full keyboard navigation for diary page flipping, quick-entry modal, and ledger filtering, including Escape-to-close and focus containment in every dialog.
- Screen reader accessibility across diary entries, balance callouts, and tabular ledger views.
- Reduced motion support that respects the OS preference by default; an in-app performance mode may suppress motion further but never override the preference upward.
