"use client"

import * as React from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

import { getScreen, type ScreenType } from "@/lib/screens"

/**
 * A single open tab. `id` is unique per instance (so the same screen can be
 * open in multiple tabs); `screenType` is what the URL's `?tab=` holds.
 */
export type Tab = {
  id: string
  screenType: ScreenType
}

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
 * The `tabs` array is runtime-only state — it is not persisted in the URL —
 * so a refresh restores only the active screen (one tab). This is the
 * tradeoff for supporting duplicate tabs while keeping URLs meaningful.
 */
export function useTabs(): TabsApi {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [tabs, setTabs] = React.useState<Tab[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)

  // Write the active tab's screenType to the URL. Using replace so tab
  // switches don't pollute browser history with one entry per focus.
  const writeActiveToUrl = React.useCallback(
    (screenType: ScreenType | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (screenType) {
        params.set(TAB_PARAM, screenType)
      } else {
        params.delete(TAB_PARAM)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  // The URL (?tab=<screenType>) is authoritative for the *active* screen.
  // When it changes (sidebar click, back/forward, refresh), sync runtime
  // state to match: ensure a tab of that type exists, then focus it. Uses
  // the "adjust state during render" pattern (storing the previous value)
  // rather than an effect — see https://react.dev/reference/react/useState#storing-information-from-previous-renders
  //
  // Seed the previous value as null (not the current param) so the very first
  // render also reconciles: on a fresh load/refresh at ?tab=inventory the tab
  // gets created and focused instead of leaving the workspace empty.
  const tabParam = searchParams.get(TAB_PARAM)
  const [prevTabParam, setPrevTabParam] = React.useState<string | null>(null)
  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam)
    const screen = getScreen(tabParam)
    if (!screen) {
      // No active screen in the URL — keep tabs open, focus nothing.
      setActiveId(null)
    } else {
      const existing = tabs.find((t) => t.screenType === screen.type)
      if (existing) {
        setActiveId(existing.id)
      } else {
        const tab: Tab = { id: newId(), screenType: screen.type }
        setTabs((prev) => [...prev, tab])
        setActiveId(tab.id)
      }
    }
  }

  const openTab = React.useCallback(
    (screenType: ScreenType) => {
      // Reuse: focus an existing tab of this type if one is open.
      const existing = tabs.find((t) => t.screenType === screenType)
      if (existing) {
        setActiveId(existing.id)
      } else {
        const tab = { id: newId(), screenType }
        setTabs((prev) => [...prev, tab])
        setActiveId(tab.id)
      }
      writeActiveToUrl(screenType)
    },
    [tabs, writeActiveToUrl],
  )

  const setActive = React.useCallback(
    (id: string) => {
      const tab = tabs.find((t) => t.id === id)
      if (!tab) return
      setActiveId(id)
      writeActiveToUrl(tab.screenType)
    },
    [tabs, writeActiveToUrl],
  )

  const closeTab = React.useCallback(
    (id: string) => {
      const idx = tabs.findIndex((t) => t.id === id)
      if (idx === -1) return
      const next = tabs.filter((t) => t.id !== id)
      setTabs(next)
      // If the closed tab was active, focus a neighbor (prefer the
      // previous tab, otherwise the next, otherwise none).
      if (activeId === id) {
        const neighbor = next[idx - 1] ?? next[idx] ?? null
        setActiveId(neighbor ? neighbor.id : null)
        writeActiveToUrl(neighbor ? neighbor.screenType : null)
      }
    },
    [tabs, activeId, writeActiveToUrl],
  )

  const duplicateTab = React.useCallback(
    (id: string) => {
      const source = tabs.find((t) => t.id === id)
      if (!source) return
      const idx = tabs.findIndex((t) => t.id === id)
      const copy = { id: newId(), screenType: source.screenType }
      // Insert right after the source tab.
      setTabs((prev) => [
        ...prev.slice(0, idx + 1),
        copy,
        ...prev.slice(idx + 1),
      ])
      setActiveId(copy.id)
      writeActiveToUrl(copy.screenType)
    },
    [tabs, writeActiveToUrl],
  )

  const closeOthers = React.useCallback(
    (id: string) => {
      const keep = tabs.find((t) => t.id === id)
      if (!keep) return
      setTabs([keep])
      setActiveId(keep.id)
      writeActiveToUrl(keep.screenType)
    },
    [tabs, writeActiveToUrl],
  )

  const closeAll = React.useCallback(() => {
    setTabs([])
    setActiveId(null)
    writeActiveToUrl(null)
  }, [writeActiveToUrl])

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
