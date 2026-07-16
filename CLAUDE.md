# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Also read `AGENTS.md` — it holds the repo's architecture conventions (pure logic in `lib/`, single-source registry, derive-don't-duplicate) with canonical examples. Those rules apply to all changes here.

## Commands

pnpm is the package manager (`pnpm@10.32.1`).

- `pnpm dev` — run the dev server
- `pnpm build` — production build (set `GITHUB_PAGES=true` for the static-export GitHub Pages build with `/pos` basePath)
- `pnpm test` — run all unit tests (vitest, Node environment)
- `pnpm test:watch` — vitest watch mode
- Single test file: `pnpm vitest run lib/tabs-reducer.test.ts`
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — eslint (one pre-existing error in `hooks/use-mobile.ts` is known and unrelated)
- `pnpm format` — prettier (`semi: false`, double quotes, tailwind class sorting)

Before finishing a change, run `pnpm typecheck`, `pnpm test`, and `pnpm build`, and `pnpm format` the files you touched.

## Next.js version warning

This repo uses Next.js 16 — a version with breaking changes relative to older training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js-specific code, and heed deprecation notices.

## Architecture

A POS dashboard built on Next.js App Router + shadcn/ui (Tailwind v4, Base UI primitives in `components/ui/`). There is effectively **one real route** (`/dashboard`); everything else is a **tabbed workspace**: "screens" are registry entries rendered inside a single client workspace and addressed by `?tabs=<screenType>,…&i=<index>`. No global store — state lives in URL search params, React local state, and `next-themes` localStorage. All data is mock fixtures (`lib/fixtures.tsx`); there is no backend.

### The screen registry is the single source of truth

`lib/screens.tsx` defines `screenDefs`; `ScreenType` is `keyof typeof screenDefs`. Each entry declares a screen's label, description, icon, and component exactly once — the sidebar, tab bar, and screen header all derive from it. **Adding a screen = one registry entry** (plus placing it in the `sidebarNav` tree in `lib/nav.tsx`). Never hand-maintain a parallel union or restate a screen's key/label elsewhere. `lib/nav.test.ts` machine-checks registry↔nav consistency via `findNavIssues`, so drift fails tests.

### Pure logic in `lib/`, thin adapters in hooks/components

Non-trivial state logic is a pure module (plain data in/out, no React runtime imports, non-determinism injected as arguments) with table-driven unit tests beside it:

- `lib/tabs-reducer.ts` — tab algebra (`(state, action) => state`); `hooks/use-tabs.ts` only wires it to the router
- `lib/list-rows.ts` — filter/sort pipeline (`deriveRows`, `cycleSort`); `components/dashboard/list-screen.tsx` only renders
- `lib/nav.tsx` — sidebar tree + consistency checks; `components/nav-main.tsx` renders it with one depth-parameterized recursive `NavNode`

New logic without a test is incomplete. Tests are `*.test.ts` next to the module, run in a plain Node environment (no DOM/render testing).

### Tab/URL flow

`app/dashboard/page.tsx` → `<Suspense>` → `TabWorkspace` → `useTabs()`. The URL carries the **whole** workspace, not just the active screen: `?tabs=orders,orders,inventory&i=1` holds the open screens in order plus the focused index, so a refresh or a shared link restores every tab. [nuqs](https://github.com/47ng/nuqs) owns the router write (`useQueryStates`, `history: "replace"`, both params in one atomic update) — there is no hand-rolled mirror effect.

**The split that matters: the URL is authoritative for _content_ (which screens, in what order, which is focused); `useTabs` state is authoritative for _identity_ (which tab is which).** `?tabs=orders,orders` is two identical strings, so identity is not expressible there and must never be re-derived from it on a normal mutation — that's how closing one of two identical tabs used to remount the survivor and destroy what the user had typed. Instead the open tabs (ids and all) live in React state, mutations run through the reducer, and the URL is written as a projection of the result.

Re-deriving identity is reserved for content arriving from **outside** — refresh, pasted link, back/forward — via the reducer's `sync` action. That guess is lossy and that's fine: an external change has no in-place screen state of ours to protect.

The pieces:

- `lib/tabs-reducer.ts` — the algebra over `{ tabs: Tab[], activeId }`, addressing tabs by **id** (the UI knows which tab it means; discarding that is what made closes ambiguous). Also owns the `WorkspaceContent` projection and `normalize`, which makes anything the URL hands us safe (clamps `i`, enforces "open tabs ⟹ exactly one focused").
- `lib/tab-url.ts` — the URL codec (parsers, `contentFromSearch`, `launcherHref`). Imports `nuqs/server`, which is React-free, so it stays a pure Node-testable module.
- `lib/tab-identity.ts` — `reconcileIds`, the external-change guess. Greedy type-matching; the `sync` path is its **only** caller by design.

`use-tabs.ts` reconciles only when the URL *changed* **and** the new content doesn't already match what it projected. Both halves are load-bearing: reacting to any state/URL divergence would undo our own mutation before the URL caught up, and reacting to every URL change would reconcile against the URL we just wrote — the lossy path this design exists to avoid.

The active screen renders with `key={activeTab.id}` so every tab switch/duplicate is a fresh remount — this is a deliberate rule. Only the active screen is mounted, so a background tab holds no state to lose; the identity work protects the tab you're *looking at* from unrelated closes.

**Launchers** (sidebar, ⌘K search) live in the dashboard *layout*, outside the workspace, so they can't call `useTabs`; they navigate instead, building the target with the same reuse-or-create `open` action so they add to the open tabs rather than replace them. The sidebar needs an href at render, so `NavMainLive` reads the URL and `app-sidebar.tsx` wraps it in `<Suspense>` — the fallback is the same `NavMain` with `freshWorkspaceHref`, a working degraded sidebar that prerenders. The ⌘K palette renders no href, so it reads the live URL at click time and needs no boundary. Anything that reads search params at render must sit inside a Suspense boundary or `/dashboard` stops prerendering.

## shadcn/ui components

- **Prioritize shadcn components** for UI work: use existing components from `components/ui/` first, and if one is missing, add it with `npx shadcn@latest add <component>` (components land in `components/ui/`) rather than hand-rolling a custom equivalent.
- **Do not modify the classes of shadcn components**: treat the Tailwind classes inside `components/ui/*` as vendored — don't edit them. Customize at the call site via the `className` prop / variants instead.
