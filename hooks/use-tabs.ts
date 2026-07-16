"use client"

import * as React from "react"
import { useQueryStates } from "nuqs"

import type { ScreenType } from "@/lib/screens"
import type { Tab } from "@/lib/tab-identity"
import {
  contentFromParams,
  launcherHref,
  tabParsers,
  toTabParams,
} from "@/lib/tab-url"
import {
  contentEquals,
  initialWorkspaceState,
  tabsReducer,
  toContent,
  type TabsAction,
  type WorkspaceContent,
} from "@/lib/tabs-reducer"

export type { Tab }

export type TabsApi = {
  /** All currently open tabs, in order. */
  tabs: Tab[]
  /** The id of the focused tab, or null when nothing is open. */
  activeId: string | null
  /** Focus a tab by id. */
  setActive: (id: string) => void
  /**
   * Open a screen as a tab. If a tab of this `screenType` is already open,
   * it is focused (reuse). Otherwise a new tab is created and focused.
   * This is what the sidebar launchers call.
   */
  openTab: (screenType: ScreenType) => void
  /** Close a tab. If it was active, a neighbor is focused instead. */
  closeTab: (id: string) => void
  /** Open a fresh tab of the same screen type with a new id. */
  duplicateTab: (id: string) => void
  /** Close every tab except the given one. */
  closeOthers: (id: string) => void
  /** Close every open tab. */
  closeAll: () => void
}

const tabUrlOptions = {
  // Tab switches shouldn't pollute history with an entry per focus.
  history: "replace" as const,
  scroll: false,
  // Keep the common URLs clean: `i` disappears when the first tab is focused.
  clearOnDefault: true,
}

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Build the href a *launcher* points at — the sidebar, which lives in the
 * dashboard layout, outside the workspace, and so can't call {@link useTabs}.
 *
 * A launcher can't be a fixed link anymore: now that the URL carries the whole
 * workspace, opening a screen has to *add to* the tabs already open rather
 * than replace them. So the href is computed per render by running the very
 * same `open` action through the tab reducer — reuse-or-create included.
 * Keeping it a real href rather than an onClick means the link still says
 * where it goes, and middle-click carries the whole workspace with it.
 *
 * Reads the URL, so callers must sit inside `<Suspense>` — see the fallback in
 * `components/app-sidebar.tsx`, which renders the same nav with
 * `freshWorkspaceHref` until the client knows what's open.
 */
export function useTabLauncherHref(): (screenType: ScreenType) => string {
  const [{ tabs, i }] = useQueryStates(tabParsers, tabUrlOptions)
  return React.useCallback(
    (screenType: ScreenType) =>
      launcherHref(contentFromParams({ tabs, i }), screenType),
    [tabs, i]
  )
}

/**
 * The tab workspace: its *content* lives in the URL (`?tabs=` and `?i=`), its
 * *identity* lives here.
 *
 * The URL carries the whole workspace, so a refresh or a shared link restores
 * every open tab, in order, with the same one focused. What it can't carry is
 * which tab is which: `?tabs=orders,orders` is two identical strings. So the
 * open tabs — ids and all — are held in React state and mutated directly, and
 * the URL is written as a projection of that state. Closing one of two
 * identical tabs therefore removes exactly the tab asked for and leaves the
 * survivor mounted, because nothing ever has to re-guess identity from the URL.
 *
 * Re-guessing is reserved for content that arrives from *outside* — a refresh,
 * a pasted link, back/forward — where {@link tabsReducer}'s `sync` matches ids
 * by screen type. That's lossy, and it doesn't matter: an external change has
 * no in-place screen state of ours to protect.
 *
 * This hook is a thin **adapter**: the algebra is the pure {@link tabsReducer},
 * and nuqs owns the router write.
 *
 * Uses `useSearchParams` underneath, so callers must sit inside `<Suspense>`.
 */
export function useTabs(): TabsApi {
  const [params, setParams] = useQueryStates(tabParsers, tabUrlOptions)
  const [state, setState] = React.useState(initialWorkspaceState)
  const urlContent = contentFromParams(params)

  // Reconcile only when the URL *changed*, and only when that change isn't
  // just our own write echoing back. Both conditions matter:
  //
  //  - Reacting to any state/URL divergence would corrupt the moment our own
  //    mutation lands: state is already updated, and if the URL hasn't caught
  //    up yet we'd "sync" the change straight back out, undoing it.
  //  - Reacting to every URL change would reconcile against the URL we just
  //    wrote — the exact lossy path this design exists to avoid.
  //
  // Together they're safe whether or not nuqs' params land in the same batch
  // as our own setState. Uses the "adjust state during render" pattern rather
  // than an effect, so tabs are correct on the very first render — see
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevContent, setPrevContent] = React.useState<WorkspaceContent | null>(
    null
  )
  let current = state
  if (prevContent === null || !contentEquals(prevContent, urlContent)) {
    setPrevContent(urlContent)
    if (!contentEquals(urlContent, toContent(state))) {
      current = tabsReducer(state, {
        type: "sync",
        content: urlContent,
        mint: newId,
      })
      setState(current)
    }
  }

  // The one place tab state is mutated: run the algebra, keep the result
  // (identity included), and project it to the URL. When that write echoes
  // back through `params`, the guard above sees it already matches this state
  // and leaves identity alone.
  const apply = React.useCallback(
    (action: TabsAction) => {
      const next = tabsReducer(current, action)
      if (next === current) return
      setState(next)
      void setParams(toTabParams(toContent(next)))
    },
    [current, setParams]
  )

  const setActive = React.useCallback(
    (id: string) => apply({ type: "setActive", id }),
    [apply]
  )

  const openTab = React.useCallback(
    (screenType: ScreenType) =>
      apply({ type: "open", screenType, newId: newId() }),
    [apply]
  )

  const closeTab = React.useCallback(
    (id: string) => apply({ type: "close", id }),
    [apply]
  )

  const duplicateTab = React.useCallback(
    (id: string) => apply({ type: "duplicate", id, newId: newId() }),
    [apply]
  )

  const closeOthers = React.useCallback(
    (id: string) => apply({ type: "closeOthers", id }),
    [apply]
  )

  const closeAll = React.useCallback(() => apply({ type: "closeAll" }), [apply])

  return {
    tabs: current.tabs,
    activeId: current.activeId,
    setActive,
    openTab,
    closeTab,
    duplicateTab,
    closeOthers,
    closeAll,
  }
}
