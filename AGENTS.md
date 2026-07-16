<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Architecture conventions

Keep modules **deep**: a small interface over logic that is easy to test in isolation. Prefer these patterns; each has a canonical example already in the repo.

## Separate pure logic from React ("logic in `lib/`, wiring in the component")

Non-trivial state logic goes in a **pure module** under `lib/` — plain data in, plain data out, no React, no router, no DOM. The hook/component is a thin **adapter** that owns I/O and calls the pure module. This is the single most important rule: it's what makes logic testable and AI-navigable.

- Tab algebra → `lib/tabs-reducer.ts` (pure `(state, action) => state`); `hooks/use-tabs.ts` only wires it to the router.
- List filter/sort → `lib/list-rows.ts` (`deriveRows`, `cycleSort`, `matches`, `compare`); `components/dashboard/list-screen.tsx` only renders.
- Keep pure modules **free of `react` runtime imports**. A `import type … from "react"` (e.g. `React.ReactNode`) is fine — it's erased at build.
- Inject non-determinism (ids, timestamps, randomness) as arguments so the pure function stays deterministic. See how `use-tabs` generates `newId()` and passes it into the reducer.

## One source of truth, derive the rest

- The **screen registry** (`lib/screens.tsx`) is the single source. `ScreenType` is `keyof typeof screenDefs` — never hand-maintain a parallel union or restate a screen's key. Adding a screen = one entry.
- Don't keep two structures in sync by hand. If you must (e.g. `sidebarNav` in `lib/nav.tsx` vs the registry), add a **pure consistency check** + test (see `findNavIssues` / `lib/nav.test.ts`) so drift fails a test, not production.
- Declare a value once and pass it down. A screen's `label`/`description` live on its registry entry only; the header is rendered by the shared `ScreenHeader`. Don't re-declare titles in config objects.
- Fixtures/mock data have **one home**: `lib/fixtures.tsx`. Don't hardcode mock literals inside components.

## Derive UI state in one place

- Compute a single derived value and read it everywhere (count, empty-state, body all read `visibleRows`) — don't maintain parallel `filtered`/`sorted` values that can silently drift.
- Mirror state → URL from **one** effect derived from state, guarded so it only writes on a real change (see the `activeType` effect in `use-tabs.ts`). Don't scatter URL writes across every mutator.
- Recursive/tree UI: one renderer parameterized by depth, not forked copies per level (see the single `NavNode` in `components/nav-main.tsx`).
- Share visual constants (e.g. `TAB_BAR_ROW`) instead of re-declaring them where they must match.

## shadcn/ui components

- **Prioritize shadcn components** for UI work: use existing components from `components/ui/` first, and if one is missing, add it with `npx shadcn@latest add <component>` (components land in `components/ui/`) rather than hand-rolling a custom equivalent.
- **Do not modify the classes of shadcn components**: treat the Tailwind classes inside `components/ui/*` as vendored — don't edit them. Customize at the call site via the `className` prop / variants instead.

## Tests

- `pnpm test` (vitest, Node env) — put unit tests next to the pure module as `*.test.ts`. Cover the logic, not the render: table-driven cases over plain data.
- Before finishing a change, run `pnpm typecheck`, `pnpm test`, and `pnpm build`. Run `pnpm format` (prettier; the repo is `semi: false`, no single quotes) so nothing shows up as unformatted.
- New logic without a test is incomplete — the point of extracting a pure module is that the test comes nearly free.
