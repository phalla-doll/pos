import type { ScreenType } from "@/lib/screens"

/**
 * A single open tab. `id` is unique per instance (so the same screen can be
 * open in multiple tabs); `screenType` is what the URL's `?tab=` holds.
 */
export type Tab = {
  id: string
  screenType: ScreenType
}

/**
 * The complete tab-workspace state: the open tabs in order, plus which one is
 * focused. This is plain data — no React, no router — so the whole tab algebra
 * below is unit-testable without a render.
 */
export type TabsState = {
  tabs: Tab[]
  activeId: string | null
}

export const initialTabsState: TabsState = { tabs: [], activeId: null }

/**
 * Every mutation the workspace can perform. Actions that may create a tab
 * carry a caller-supplied `newId` so the reducer stays pure and deterministic
 * (id generation is the adapter's job, which keeps tests free of randomness).
 */
export type TabsAction =
  /**
   * Reconcile against the authoritative `?tab=` screen: reuse an open tab of
   * that type or create one, then focus it. `null` focuses nothing but leaves
   * the open tabs untouched.
   */
  | { type: "sync"; screenType: ScreenType | null; newId: string }
  /** Open a screen as a tab (reuse an existing tab of that type, else create). */
  | { type: "open"; screenType: ScreenType; newId: string }
  /** Focus a tab by id. No-op if the id isn't open. */
  | { type: "setActive"; id: string }
  /** Close a tab. If it was active, a neighbor is focused instead. */
  | { type: "close"; id: string }
  /** Open a fresh tab of the same screen type, inserted after the source. */
  | { type: "duplicate"; id: string; newId: string }
  /** Close every tab except the given one. */
  | { type: "closeOthers"; id: string }
  /** Close every open tab and clear the active focus. */
  | { type: "closeAll" }

/**
 * Reuse an open tab of `screenType` (focusing it) or create one at the end and
 * focus that. Returns the same state reference when nothing changes, so React
 * (and the URL-sync effect that watches state) can skip redundant work.
 */
function openOrReuse(
  state: TabsState,
  screenType: ScreenType,
  newId: string
): TabsState {
  const existing = state.tabs.find((t) => t.screenType === screenType)
  if (existing) {
    if (state.activeId === existing.id) return state
    return { ...state, activeId: existing.id }
  }
  const tab: Tab = { id: newId, screenType }
  return { tabs: [...state.tabs, tab], activeId: tab.id }
}

/**
 * The pure tab reducer: `(state, action) → state`. This is the whole tab
 * algebra — open/reuse, neighbor-focus on close, duplicate-after-source,
 * close-others, close-all, and URL reconciliation — in one place, with no
 * React or router dependency.
 */
export function tabsReducer(state: TabsState, action: TabsAction): TabsState {
  switch (action.type) {
    case "sync": {
      if (action.screenType === null) {
        // No active screen in the URL — keep tabs open, focus nothing.
        return state.activeId === null ? state : { ...state, activeId: null }
      }
      return openOrReuse(state, action.screenType, action.newId)
    }

    case "open":
      return openOrReuse(state, action.screenType, action.newId)

    case "setActive": {
      const exists = state.tabs.some((t) => t.id === action.id)
      if (!exists || state.activeId === action.id) return state
      return { ...state, activeId: action.id }
    }

    case "close": {
      const idx = state.tabs.findIndex((t) => t.id === action.id)
      if (idx === -1) return state
      const tabs = state.tabs.filter((t) => t.id !== action.id)
      // Closing a background tab doesn't move focus.
      if (state.activeId !== action.id) return { ...state, tabs }
      // The closed tab was active — focus a neighbor (prefer the previous
      // tab, otherwise the next, otherwise none).
      const neighbor = tabs[idx - 1] ?? tabs[idx] ?? null
      return { tabs, activeId: neighbor ? neighbor.id : null }
    }

    case "duplicate": {
      const idx = state.tabs.findIndex((t) => t.id === action.id)
      if (idx === -1) return state
      const source = state.tabs[idx]
      const copy: Tab = { id: action.newId, screenType: source.screenType }
      // Insert right after the source tab and focus the copy.
      const tabs = [
        ...state.tabs.slice(0, idx + 1),
        copy,
        ...state.tabs.slice(idx + 1),
      ]
      return { tabs, activeId: copy.id }
    }

    case "closeOthers": {
      const keep = state.tabs.find((t) => t.id === action.id)
      if (!keep) return state
      if (state.tabs.length === 1 && state.activeId === keep.id) return state
      return { tabs: [keep], activeId: keep.id }
    }

    case "closeAll":
      return state.tabs.length === 0 && state.activeId === null
        ? state
        : initialTabsState

    default:
      return state
  }
}

/** The screen type mirrored to `?tab=` for a given state, or `null`. */
export function activeScreenType(state: TabsState): ScreenType | null {
  return state.tabs.find((t) => t.id === state.activeId)?.screenType ?? null
}
