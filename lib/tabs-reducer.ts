import {
  refKey,
  reconcileIds,
  type ScreenRef,
  type Tab,
} from "@/lib/tab-identity"

/**
 * The workspace as the URL can express it: which screens are open, in order,
 * and which one is focused. This is the *content* of the workspace — plain,
 * serializable data.
 */
export type WorkspaceContent = {
  /** The open screens, in tab-bar order. The same ref may appear twice. */
  refs: ScreenRef[]
  /** Index into `refs` of the focused tab, or -1 when no tabs are open. */
  activeIndex: number
}

/**
 * The workspace at runtime: the same content, plus the instance identity the
 * URL *cannot* carry. Two tabs of the same screen are one string in the URL but
 * two distinct tabs here, each with its own `id` — which is what `key`s the
 * active screen and therefore decides what remounts.
 *
 * The split is the whole point: the URL is authoritative for **content**, this
 * state is authoritative for **identity**. Identity was never in the URL, so it
 * can't be derived from it — only carried alongside and reconciled when the URL
 * changes underneath us (see the `sync` action).
 *
 * Plain data — no React, no router — so the algebra below is unit-testable
 * without a render.
 */
export type WorkspaceState = {
  tabs: Tab[]
  activeId: string | null
}

export const initialWorkspaceState: WorkspaceState = {
  tabs: [],
  activeId: null,
}
export const emptyContent: WorkspaceContent = { refs: [], activeIndex: -1 }

/**
 * Every mutation the workspace can perform. Tabs are addressed by `id`, not by
 * position: the UI knows exactly which tab it means, and throwing that away in
 * favour of an index is what used to make a close ambiguous.
 *
 * Actions that create a tab carry a caller-supplied `newId`, and `sync` carries
 * a `mint`, so the reducer stays pure and deterministic — id generation is the
 * adapter's job, which keeps tests free of randomness.
 */
export type TabsAction =
  /**
   * Reconcile against content that arrived from outside — a refresh, a pasted
   * link, back/forward. Identity is re-derived by type-matching, which is
   * lossy but adequate: an external change never has in-place screen state to
   * protect, because the screens involved weren't ours to begin with.
   */
  | { type: "sync"; content: WorkspaceContent; mint: () => string }
  /** Open a screen as a tab (reuse an existing tab of that ref, else create). */
  | { type: "open"; ref: ScreenRef; newId: string }
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
 * Force candidate content to satisfy the invariant "open tabs always have
 * exactly one focused", so anything the URL hands us is safe to render.
 * `?tabs=orders,inventory&i=9` clamps to the last tab; `?tabs=orders,inventory`
 * (no `i`) focuses the first; a stray `?i=3` with no tabs collapses to empty.
 *
 * Returns the same reference when nothing changes.
 */
export function normalize(content: WorkspaceContent): WorkspaceContent {
  if (content.refs.length === 0) {
    return content.activeIndex === -1 ? content : emptyContent
  }
  const clamped = Number.isInteger(content.activeIndex)
    ? Math.min(Math.max(content.activeIndex, 0), content.refs.length - 1)
    : 0
  return clamped === content.activeIndex
    ? content
    : { ...content, activeIndex: clamped }
}

/**
 * Project runtime state down to the content the URL carries — everything but
 * the ids. `param` is dropped when absent rather than carried as `undefined`,
 * so the projection compares equal to what the URL parses back.
 */
export function toContent(state: WorkspaceState): WorkspaceContent {
  return {
    refs: state.tabs.map(({ screenType, param }) =>
      param === undefined ? { screenType } : { screenType, param }
    ),
    activeIndex: state.tabs.findIndex((tab) => tab.id === state.activeId),
  }
}

/**
 * Lift content into a throwaway state with placeholder ids. Only ever used to
 * run the algebra over content we have no identity for — the launcher hrefs,
 * which project straight back to content — so the ids never escape.
 */
export function fromContent(content: WorkspaceContent): WorkspaceState {
  const tabs = content.refs.map((ref, i) => ({
    id: `placeholder-${i}`,
    ...ref,
  }))
  return { tabs, activeId: tabs[content.activeIndex]?.id ?? null }
}

/** Value equality for content — the arrays are rebuilt on every URL read. */
export function contentEquals(
  a: WorkspaceContent,
  b: WorkspaceContent
): boolean {
  return (
    a.activeIndex === b.activeIndex &&
    a.refs.length === b.refs.length &&
    a.refs.every((ref, i) => refKey(ref) === refKey(b.refs[i]))
  )
}

/**
 * Reuse an open tab with the same {@link refKey} (focusing it) or create one at
 * the end and focus that. Returns the same state reference when nothing
 * changes.
 *
 * Matching on the whole ref is what lets a list and its record forms coexist:
 * opening `inventory` must not focus the `inventory:SKU-001` tab, and vice
 * versa. It is also the entire reuse policy for record tabs — a draft carries
 * a freshly minted param and so never matches, giving every "New" its own tab,
 * while an edit carries the row key and so always matches, keeping one record
 * to one tab.
 */
function openOrReuse(
  state: WorkspaceState,
  ref: ScreenRef,
  newId: string
): WorkspaceState {
  const wanted = refKey(ref)
  const existing = state.tabs.find((t) => refKey(t) === wanted)
  if (existing) {
    if (state.activeId === existing.id) return state
    return { ...state, activeId: existing.id }
  }
  const tab: Tab = { id: newId, ...ref }
  return { tabs: [...state.tabs, tab], activeId: tab.id }
}

/**
 * The pure tab reducer: `(state, action) → state`. This is the whole tab
 * algebra — open/reuse, neighbor-focus on close, duplicate-after-source,
 * close-others, close-all, and URL reconciliation — in one place, with no React
 * or router dependency.
 *
 * Because identity rides along in the state, an ordinary mutation never has to
 * guess: closing one of two identical tabs removes exactly the one asked for
 * and leaves the survivor's id — and so its mounted screen — untouched.
 *
 * Returns the same reference when nothing changes.
 */
export function tabsReducer(
  state: WorkspaceState,
  action: TabsAction
): WorkspaceState {
  switch (action.type) {
    case "sync": {
      const content = normalize(action.content)
      const tabs = reconcileIds(state.tabs, content.refs, action.mint)
      const activeId = tabs[content.activeIndex]?.id ?? null
      if (tabs === state.tabs && activeId === state.activeId) return state
      return { tabs, activeId }
    }

    case "open":
      return openOrReuse(state, action.ref, action.newId)

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
      // Ref and all: duplicating a record tab gives a second, independent
      // mount of the same record — the same thing duplicating a list gives.
      const copy: Tab = { ...source, id: action.newId }
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
        : initialWorkspaceState

    default:
      return state
  }
}
