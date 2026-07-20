import {
  createLoader,
  createParser,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
} from "nuqs/server"

import { getScreen } from "@/lib/screens"
import { refKey, type ScreenRef } from "@/lib/tab-identity"
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
 * One tab's token: `inventory`, or `inventory:SKU-001` for a screen narrowed
 * to a record.
 *
 * Split on the **first** colon, so a param containing one lands in the tail
 * intact — screen keys are kebab-case and never contain a colon, which is what
 * makes the first occurrence unambiguously the delimiter. Commas are the array
 * separator and are escaped by `parseAsArrayOf` on both legs, so nothing here
 * has to encode them; everything else rides the ordinary query-string encoding
 * nuqs applies to the whole value.
 *
 * An unknown screen is still rejected, so nothing outside the registry can
 * enter tab state — exactly what `parseAsStringLiteral` guaranteed before
 * params existed. The param itself is carried through as-is for now; no screen
 * produces one yet, so there is nothing to validate it against.
 */
const parseAsScreenRef = createParser({
  parse(token: string): ScreenRef | null {
    const colon = token.indexOf(":")
    const type = colon === -1 ? token : token.slice(0, colon)
    const screen = getScreen(type)
    if (!screen) return null
    return colon === -1
      ? { screenType: screen.type }
      : { screenType: screen.type, param: token.slice(colon + 1) }
  },
  serialize: refKey,
  eq: (a: ScreenRef, b: ScreenRef) => refKey(a) === refKey(b),
})

/**
 * The workspace's URL contract: `?tabs=orders,orders,inventory:SKU-001&i=1` —
 * the open screens in order, plus the index of the focused one.
 *
 * Tokens that don't survive {@link parseAsScreenRef} are dropped by
 * `parseAsArrayOf`, so `tabs` is always a list of real refs; a missing or
 * out-of-range `i` is {@link normalize}'s problem.
 *
 * Imported from `nuqs/server`, which is React-free — so this module stays pure
 * and testable in a plain Node environment, and the hook is the only piece
 * that touches the router.
 */
export const tabParsers = {
  tabs: parseAsArrayOf(parseAsScreenRef, ",").withDefault([]),
  i: parseAsInteger.withDefault(0),
}

/** The raw `{ tabs, i }` values as they appear in the URL. */
export type TabParams = {
  tabs: ScreenRef[]
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
    tabs: content.refs.length > 0 ? content.refs : null,
    i: content.activeIndex >= 0 ? content.activeIndex : null,
  }
}

/** Read normalized workspace content out of URL values. */
export function contentFromParams(params: TabParams): WorkspaceContent {
  return normalize({ refs: params.tabs, activeIndex: params.i })
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
 * Where a launcher should go: the given content with `ref` opened — reusing an
 * already-open tab for that ref, exactly like the in-workspace launchers,
 * because it runs the same `open` action through the same reducer.
 *
 * The reducer works in tabs-with-identity, and a launcher has none to offer
 * (it only ever saw the URL), so the content is lifted into placeholder ids
 * and projected straight back. The ids never escape this call — what matters
 * is that the reuse-or-create rule is stated exactly once, in the reducer.
 */
export function launcherHref(
  content: WorkspaceContent,
  ref: ScreenRef
): string {
  const opened = tabsReducer(fromContent(content), {
    type: "open",
    ref,
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
export function freshWorkspaceHref(ref: ScreenRef): string {
  return launcherHref(emptyContent, ref)
}
