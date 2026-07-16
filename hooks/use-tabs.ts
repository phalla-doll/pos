"use client"

import * as React from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

import { getScreen, type ScreenType } from "@/lib/screens"
import {
  activeScreenType,
  initialTabsState,
  tabsReducer,
  type Tab,
} from "@/lib/tabs-reducer"

export type { Tab }

export type TabsApi = {
  /** All currently open tabs, in order. */
  tabs: Tab[]
  /** The id of the focused tab, or null when nothing is focused. */
  activeId: string | null
  /** Focus a tab by id (writes `?tab=<screenType>`). */
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
  /** Close every open tab and clear the active focus. */
  closeAll: () => void
}

const TAB_PARAM = "tab"

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Tab workspace state, with the active tab mirrored to the URL via
 * `?tab=<screenType>`.
 *
 * This hook is a thin **adapter**: all tab algebra lives in the pure
 * {@link tabsReducer}; the hook only wires it to the router — reading `?tab=`
 * as the authoritative active screen and mirroring the reducer's active tab
 * back to the URL in one place.
 *
 * The `tabs` array is runtime-only state — it is not persisted in the URL —
 * so a refresh restores only the active screen (one tab). This is the
 * tradeoff for supporting duplicate tabs while keeping URLs meaningful.
 */
export function useTabs(): TabsApi {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [state, dispatch] = React.useReducer(tabsReducer, initialTabsState)
  const { tabs, activeId } = state

  // The URL (?tab=<screenType>) is authoritative for the *active* screen.
  // When it changes (sidebar click, back/forward, refresh), reconcile runtime
  // state to match. Uses the "adjust state during render" pattern (storing the
  // previous value) rather than an effect — see
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  //
  // Seed the previous value as null (not the current param) so the very first
  // render also reconciles: on a fresh load/refresh at ?tab=inventory the tab
  // gets created and focused instead of leaving the workspace empty.
  const tabParam = searchParams.get(TAB_PARAM)
  const [prevTabParam, setPrevTabParam] = React.useState<string | null>(null)
  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam)
    const screen = getScreen(tabParam)
    dispatch({
      type: "sync",
      screenType: screen ? screen.type : null,
      newId: newId(),
    })
  }

  // Mirror the active tab's screenType to the URL — the single place this
  // sync happens (derived from state, not re-fired from every mutator). Using
  // replace so tab switches don't pollute browser history with one entry per
  // focus. The early-return guard is essential: it skips the write whenever
  // the URL already matches, so a fresh `searchParams` reference (which an
  // identical replace can still produce) can't spin this effect into a loop.
  const activeType = activeScreenType(state)
  React.useEffect(() => {
    if (searchParams.get(TAB_PARAM) === (activeType ?? null)) return
    const params = new URLSearchParams(searchParams.toString())
    if (activeType) {
      params.set(TAB_PARAM, activeType)
    } else {
      params.delete(TAB_PARAM)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [activeType, router, pathname, searchParams])

  const setActive = React.useCallback(
    (id: string) => dispatch({ type: "setActive", id }),
    []
  )

  const openTab = React.useCallback(
    (screenType: ScreenType) =>
      dispatch({ type: "open", screenType, newId: newId() }),
    []
  )

  const closeTab = React.useCallback(
    (id: string) => dispatch({ type: "close", id }),
    []
  )

  const duplicateTab = React.useCallback(
    (id: string) => dispatch({ type: "duplicate", id, newId: newId() }),
    []
  )

  const closeOthers = React.useCallback(
    (id: string) => dispatch({ type: "closeOthers", id }),
    []
  )

  const closeAll = React.useCallback(() => dispatch({ type: "closeAll" }), [])

  return {
    tabs,
    activeId,
    setActive,
    openTab,
    closeTab,
    duplicateTab,
    closeOthers,
    closeAll,
  }
}
