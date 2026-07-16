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
- `pnpm lint` — eslint (two pre-existing errors in `components/header-search.tsx` and `hooks/use-mobile.ts` are known and unrelated)
- `pnpm format` — prettier (`semi: false`, double quotes, tailwind class sorting)

Before finishing a change, run `pnpm typecheck`, `pnpm test`, and `pnpm build`, and `pnpm format` the files you touched.

## Next.js version warning

This repo uses Next.js 16 — a version with breaking changes relative to older training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js-specific code, and heed deprecation notices.

## Architecture

A POS dashboard built on Next.js App Router + shadcn/ui (Tailwind v4, Base UI primitives in `components/ui/`). There is effectively **one real route** (`/dashboard`); everything else is a **tabbed workspace**: "screens" are registry entries rendered inside a single client workspace and addressed by `?tab=<screenType>`. No global store — state lives in URL search params, React local state, and `next-themes` localStorage. All data is mock fixtures (`lib/fixtures.tsx`); there is no backend.

### The screen registry is the single source of truth

`lib/screens.tsx` defines `screenDefs`; `ScreenType` is `keyof typeof screenDefs`. Each entry declares a screen's label, description, icon, and component exactly once — the sidebar, tab bar, and screen header all derive from it. **Adding a screen = one registry entry** (plus placing it in the `sidebarNav` tree in `lib/nav.tsx`). Never hand-maintain a parallel union or restate a screen's key/label elsewhere. `lib/nav.test.ts` machine-checks registry↔nav consistency via `findNavIssues`, so drift fails tests.

### Pure logic in `lib/`, thin adapters in hooks/components

Non-trivial state logic is a pure module (plain data in/out, no React runtime imports, non-determinism injected as arguments) with table-driven unit tests beside it:

- `lib/tabs-reducer.ts` — tab algebra (`(state, action) => state`); `hooks/use-tabs.ts` only wires it to the router
- `lib/list-rows.ts` — filter/sort pipeline (`deriveRows`, `cycleSort`); `components/dashboard/list-screen.tsx` only renders
- `lib/nav.tsx` — sidebar tree + consistency checks; `components/nav-main.tsx` renders it with one depth-parameterized recursive `NavNode`

New logic without a test is incomplete. Tests are `*.test.ts` next to the module, run in a plain Node environment (no DOM/render testing).

### Tab/URL flow

`app/dashboard/page.tsx` → `<Suspense>` → `TabWorkspace` → `useTabs()`. The URL `?tab=` param is authoritative for the *active* screen: `use-tabs.ts` reconciles it into reducer state during render, and mirrors state back to the URL from **one** guarded effect (`router.replace`). The open-tabs array is runtime-only (refresh restores just the active tab). The active screen renders with `key={activeTab.id}` so every tab switch/duplicate is a fresh remount — this is a deliberate rule.

## shadcn/ui components

- **Prioritize shadcn components** for UI work: use existing components from `components/ui/` first, and if one is missing, add it with `npx shadcn@latest add <component>` (components land in `components/ui/`) rather than hand-rolling a custom equivalent.
- **Do not modify the classes of shadcn components**: treat the Tailwind classes inside `components/ui/*` as vendored — don't edit them. Customize at the call site via the `className` prop / variants instead.
