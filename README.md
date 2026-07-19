# POS

A point-of-sale admin dashboard built on Next.js 16 (App Router), React 19, Tailwind v4, and shadcn/ui. The whole app is a **single tabbed workspace**: every "screen" is a registry entry rendered inside one route and addressed entirely by URL search params, so a refresh or a shared link restores the full set of open tabs.

All data is mock fixtures — there is no backend.

> **Live demo:** deployed to GitHub Pages from `main` via `.github/workflows/deploy.yml` (static export, `/pos` basePath).

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000 — the app itself lives at /dashboard
```

Requires [pnpm](https://pnpm.io) `10.32.1` (pinned via `packageManager`).

## Commands

| Command           | What it does                                                                         |
| ----------------- | ------------------------------------------------------------------------------------ |
| `pnpm dev`        | Dev server                                                                           |
| `pnpm build`      | Production build. Set `GITHUB_PAGES=true` for the static export with `/pos` basePath |
| `pnpm start`      | Serve the production build                                                           |
| `pnpm test`       | Unit tests (vitest, Node env) — 231 tests across 12 files                            |
| `pnpm test:watch` | Vitest watch mode                                                                    |
| `pnpm typecheck`  | `tsc --noEmit`                                                                       |
| `pnpm lint`       | ESLint (one pre-existing error in `hooks/use-mobile.ts` is known)                    |
| `pnpm format`     | Prettier — `semi: false`, double quotes, Tailwind class sorting                      |

Single test file: `pnpm vitest run lib/tabs-reducer.test.ts`

Before finishing a change: run `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm format` the files you touched.

## Architecture

### One route, many screens

There is effectively one real route (`/dashboard`). Everything else is a **screen** — a registry entry rendered inside the client workspace and addressed by `?tabs=<screenType>,…&i=<index>`.

```
app/
  layout.tsx            root layout (theme provider, title template)
  page.tsx              landing page with a link into /dashboard
  dashboard/
    layout.tsx          sidebar + header shell (launchers live here)
    page.tsx            <Suspense> → TabWorkspace
```

State lives in URL search params, React local state, and `next-themes` localStorage. There is no global store.

### The screen registry is the single source of truth

`lib/screens.tsx` defines `screenDefs`; `ScreenType` is `keyof typeof screenDefs`. Each entry declares a screen's label, description, icon, and component **exactly once** — the sidebar, tab bar, screen header, and URL validation all derive from it.

**Adding a screen = one registry entry**, plus placing it in the `sidebarNav` tree in `lib/nav.tsx`. Never hand-maintain a parallel union or restate a screen's key/label elsewhere. `lib/nav.test.ts` machine-checks registry↔nav consistency via `findNavIssues`, so drift fails tests.

Three registry builders share one signature (`label`, `Icon`, `description`):

- `screen(…)` — placeholder skeleton (most screens)
- `listScreen(…, config)` — filter bar + sortable table (`customer-listing`, `inventory`)
- `overviewScreen(…)` — the analytics dashboard

The 22 screens are grouped in the sidebar as: Dashboard, POS Screen, **Admin Tools** (Users, Roles, Permissions, ▸ System ▸ Maintenance), **Customers**, **Reports** (▸ Financials ▸ Statements), Suppliers, Inventory, Settings — the tree goes four levels deep and is rendered by a single depth-parameterized `NavNode` in `components/nav-main.tsx`.

### Tab/URL flow

`app/dashboard/page.tsx` → `<Suspense>` → `TabWorkspace` → `useTabs()`.

The URL carries the **whole** workspace, not just the active screen: `?tabs=orders,orders,inventory&i=1` holds the open screens in order plus the focused index. [nuqs](https://github.com/47ng/nuqs) owns the router write (`useQueryStates`, `history: "replace"`, both params in one atomic update) — there is no hand-rolled mirror effect.

**The split that matters:** the URL is authoritative for _content_ (which screens, in what order, which is focused); `useTabs` state is authoritative for _identity_ (which tab is which). `?tabs=orders,orders` is two identical strings, so identity is not expressible there and must never be re-derived from it on a normal mutation — that's how closing one of two identical tabs used to remount the survivor and destroy what the user had typed. Instead the open tabs (ids and all) live in React state, mutations run through the reducer, and the URL is written as a projection of the result.

Re-deriving identity is reserved for content arriving from **outside** — refresh, pasted link, back/forward — via the reducer's `sync` action. That guess is lossy, and that's fine: an external change has no in-place screen state to protect.

The pieces:

- **`lib/tabs-reducer.ts`** — the algebra over `{ tabs, activeId }`, addressing tabs by **id** (discarding that is what made closes ambiguous). Owns the `WorkspaceContent` projection and `normalize`, which clamps `i` and enforces "open tabs ⟹ exactly one focused".
- **`lib/tab-url.ts`** — the URL codec (`tabParsers`, `contentFromSearch`, `workspaceHref`, `launcherHref`, `freshWorkspaceHref`). Imports `nuqs/server`, which is React-free, so it stays pure and Node-testable.
- **`lib/tab-identity.ts`** — `reconcileIds`, the external-change guess. Greedy type-matching; the `sync` path is its **only** caller by design.
- **`lib/tab-overflow.ts`** — `partitionTabs`, deciding which tab chips fit the bar and which spill into the overflow menu.

`use-tabs.ts` reconciles only when the URL _changed_ **and** the new content doesn't already match what it projected. Both halves are load-bearing: reacting to any state/URL divergence would undo our own mutation before the URL caught up, and reacting to every URL change would reconcile against the URL we just wrote — the lossy path this design exists to avoid.

The active screen renders with `key={activeTab.id}`, so every tab switch/duplicate is a fresh remount — a deliberate rule. Only the active screen is mounted, so a background tab holds no state to lose; the identity work protects the tab you're _looking at_ from unrelated closes.

**Launchers** (sidebar, ⌘K search) live in the dashboard _layout_, outside the workspace, so they can't call `useTabs`; they navigate instead, building the target with the same reuse-or-create `open` action so they add to the open tabs rather than replace them. The sidebar needs an href at render, so `NavMainLive` reads the URL and `app-sidebar.tsx` wraps it in `<Suspense>` — the fallback is the same `NavMain` with `freshWorkspaceHref`, a working degraded sidebar that prerenders. Anything reading search params at render must sit inside a Suspense boundary or `/dashboard` stops prerendering.

### Pure logic in `lib/`, thin adapters in hooks/components

Non-trivial state logic is a pure module — plain data in/out, no React runtime imports, non-determinism injected as arguments — with table-driven unit tests beside it.

| Module                  | Responsibility                                                                                                                                                    | Adapter                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `lib/tabs-reducer.ts`   | Tab algebra `(state, action) => state`                                                                                                                            | `hooks/use-tabs.ts`                    |
| `lib/tab-url.ts`        | URL ↔ `WorkspaceContent` codec                                                                                                                                    | `hooks/use-tabs.ts`                    |
| `lib/tab-identity.ts`   | `reconcileIds` for external URL changes                                                                                                                           | reducer `sync` action                  |
| `lib/tab-overflow.ts`   | `partitionTabs` — visible vs. overflow chips                                                                                                                      | `components/dashboard/tab-bar.tsx`     |
| `lib/list-rows.ts`      | Filter/sort pipeline: `deriveRows`, `cycleSort`, `matches`, `compare`, `toClipboardText`                                                                          | `components/dashboard/list-screen.tsx` |
| `lib/list-selection.ts` | Row selection: `toggleRow`, `toggleAll`, `selectionSummary`                                                                                                       | `list-screen.tsx`                      |
| `lib/list-delete.ts`    | `deletePlan` — delete confirmation preview                                                                                                                        | `list-screen.tsx`                      |
| `lib/analytics.ts`      | KPI/chart derivations: `summarizeKpis`, `hourlyMetrics`, `salesByHour`, `revenueByCategory`, `topSellers`, `inventoryHealth`, `paymentMix`, `outstandingBalances` | `dashboard-screen.tsx`                 |
| `lib/format.ts`         | `money`, `wholeMoney`, `axisMoney`, `percent`, `signedPercent`                                                                                                    | charts + cards                         |
| `lib/nav.tsx`           | Sidebar tree + `flattenNav`, `collectScreenTypes`, `findNavIssues`                                                                                                | `components/nav-main.tsx`              |
| `lib/title.ts`          | `documentTitle`, `workspaceTitle`, `titleTemplate`                                                                                                                | `hooks/use-document-title.ts`          |
| `lib/sidebar-pin.ts`    | `pinCookie` / `readPinned` — sidebar pin persistence                                                                                                              | `app/dashboard/layout.tsx`             |

Tests are `*.test.ts` next to the module, run in a plain Node environment (no DOM or render testing). **New logic without a test is incomplete** — the point of extracting a pure module is that the test comes nearly free.

### Screens with real behavior

- **Dashboard** (`components/dashboard/dashboard-screen.tsx`) — KPI stat cards with period deltas, a Recharts area chart of hourly revenue/transactions/basket/margin, revenue by category, top sellers (`RankedBars`), inventory health and payment mix (`SegmentedBar`), and outstanding customer balances. Everything is derived from `lib/analytics.ts` over `lib/fixtures.tsx`.
- **List screens** (`components/dashboard/list-screen.tsx`) — a config-driven table: per-column filters with kind-aware operators, click-to-cycle sorting, an advanced filter panel, row selection with bulk actions, a context menu, copy-to-clipboard, and delete confirmation. Powers Customer Listing and Inventory from column configs declared in the registry.

### UI conventions (shadcn/ui)

- **Prioritize shadcn components.** Use what's in `components/ui/` first; if one is missing, add it with `npx shadcn@latest add <component>` rather than hand-rolling an equivalent.
- **Do not modify the classes of shadcn components.** Treat the Tailwind classes inside `components/ui/*` as vendored. Customize at the call site via `className` / variants.
- Shared visual constants (e.g. `TAB_BAR_ROW`, the collapsed-rail metrics in `lib/sidebar-metrics.ts`) are declared once instead of restated where they must match.

### Keyboard

- **⌘K / Ctrl+K** — command palette (`components/header-search.tsx`, cmdk). Searches screen labels and their nav path; renders no href, so it reads the live URL at click time. The modifier glyph is server-rendered as `⌘` and corrected to `Ctrl` off-Apple during hydration (`MetaKey`, via `useSyncExternalStore` rather than an effect).
- **`d`** — toggle dark mode (`ThemeHotkey` in `components/theme-provider.tsx`). Ignores repeats, any modifier, and keystrokes aimed at a typing target (`input` / `textarea` / `select` / `contenteditable`).

Shortcut labels shown in the list screen's context menus (`⌘C`, `⌘T`, `⌘P`) are visual hints — no handlers are bound to them.

## Mock data

All fixtures live in `lib/fixtures.tsx` — one home, no mock literals inside components:

- `sampleInventory: InventoryItem[]`, `sampleCustomers: Customer[]`
- `todaySales` / `yesterdaySales: Sale[]`, deterministically generated per business date
- `TRADING_HOURS`, `businessDate`, `sidebarUser`, `sidebarWorkspace`
- Types: `Customer`, `InventoryItem`, `Sale`, `SaleLine`, `PaymentMethod`

## Deployment

`.github/workflows/deploy.yml` builds on every push to `main` (and on `workflow_dispatch`) and deploys to GitHub Pages: Node 20, `pnpm install --frozen-lockfile`, then `pnpm build` with `GITHUB_PAGES=true`, uploading `./out`. `next.config.ts` switches to `output: "export"`, `basePath: "/pos"`, and unoptimized images only when that env var is set.

## Next.js version note

This repo uses **Next.js 16**, which has breaking changes relative to older training data and documentation. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js-specific code, and heed deprecation notices.

## Further reading

- `AGENTS.md` — the architecture conventions above, with canonical in-repo examples
- `CLAUDE.md` — guidance for Claude Code in this repo
- `ARCHITECTURE_REVIEW.md` — a read-only audit of module-deepening opportunities (July 2026)
