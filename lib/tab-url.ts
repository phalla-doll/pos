import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsStringLiteral,
} from "nuqs/server"

import { screenKeys, type ScreenType } from "@/lib/screens"
import {
  emptyContent,
  fromContent,
  normalize,
  tabsReducer,
  toContent,
  type WorkspaceContent,
} from "@/lib/tabs-reducer"

/** The route the workspace lives at — every launcher href points here. */
const DASHBOARD = "/dashboard"

/**
 * The workspace's URL contract: `?tabs=orders,orders,inventory&i=1` — the open
 * screens in order, plus the index of the focused one.
 *
 * Unknown screen names are dropped at parse time (`parseAsStringLiteral`
 * rejects anything outside the registry and `parseAsArrayOf` filters the
 * rejects), so `tabs` is always a real `ScreenType[]`; a missing or
 * out-of-range `i` is {@link normalize}'s problem.
 *
 * Imported from `nuqs/server`, which is React-free — so this module stays pure
 * and testable in a plain Node environment, and the hook is the only piece
 * that touches the router.
 */
export const tabParsers = {
  tabs: parseAsArrayOf(parseAsStringLiteral(screenKeys), ",").withDefault([]),
  i: parseAsInteger.withDefault(0),
}

/** The raw `{ tabs, i }` values as they appear in the URL. */
export type TabParams = {
  tabs: ScreenType[]
  i: number
}

const loadTabParams = createLoader(tabParsers)
const serializeTabParams = createSerializer(tabParsers, {
  // Keep the common URLs clean: `i` disappears when the first tab is focused.
  clearOnDefault: true,
})

/** Turn workspace content back into URL values, clearing what isn't needed. */
export function toTabParams(content: WorkspaceContent) {
  return {
    tabs: content.types.length > 0 ? content.types : null,
    i: content.activeIndex >= 0 ? content.activeIndex : null,
  }
}

/** Read normalized workspace content out of URL values. */
export function contentFromParams(params: TabParams): WorkspaceContent {
  return normalize({ types: params.tabs, activeIndex: params.i })
}

/** Read normalized workspace content straight out of a query string. */
export function contentFromSearch(search: string): WorkspaceContent {
  return contentFromParams(loadTabParams(search) as TabParams)
}

/** The dashboard URL for a piece of workspace content. */
export function workspaceHref(content: WorkspaceContent): string {
  return serializeTabParams(DASHBOARD, toTabParams(content))
}

/**
 * Where a launcher should go: the given content with `screenType` opened —
 * reusing an already-open tab of that type, exactly like the in-workspace
 * launchers, because it runs the same `open` action through the same reducer.
 *
 * The reducer works in tabs-with-identity, and a launcher has none to offer
 * (it only ever saw the URL), so the content is lifted into placeholder ids
 * and projected straight back. The ids never escape this call — what matters
 * is that the reuse-or-create rule is stated exactly once, in the reducer.
 */
export function launcherHref(
  content: WorkspaceContent,
  screenType: ScreenType
): string {
  const opened = tabsReducer(fromContent(content), {
    type: "open",
    screenType,
    newId: "placeholder-new",
  })
  return workspaceHref(toContent(opened))
}

/**
 * Where a launcher goes when the current workspace isn't known yet: a fresh
 * workspace holding just this screen.
 *
 * This is what the sidebar renders during prerender, before the client has
 * read the URL — a correct, working link that simply doesn't preserve tabs it
 * can't see yet. See the Suspense fallback in `components/app-sidebar.tsx`.
 */
export function freshWorkspaceHref(screenType: ScreenType): string {
  return launcherHref(emptyContent, screenType)
}
