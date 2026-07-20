import type { ScreenType } from "@/lib/screens"

/**
 * What a tab points at: a registry screen, optionally narrowed to one record.
 *
 * The `param` is opaque here — this module never interprets it, it only
 * compares it. Its meaning belongs to the screen that declared it accepts one
 * (see `Screen["detail"]` in `@/lib/screens`): for the list screens it is
 * either a draft token, so every "New" opens its own form, or a row key, so
 * editing a record twice lands on the tab already open for it.
 *
 * A paramless ref is the screen itself — the list, the dashboard, a report.
 */
export type ScreenRef = {
  screenType: ScreenType
  param?: string
}

/**
 * A single open tab. The ref is what the URL carries; `id` is a runtime
 * instance handle that exists only so the workspace can key its mount on it
 * (and so the tab bar can address a specific tab when the same screen is open
 * twice).
 */
export type Tab = ScreenRef & {
  id: string
}

/**
 * The string that decides whether two refs mean the same thing — `"inventory"`
 * or `"inventory:SKU-001"`.
 *
 * This is the *matching* key, not the URL token: it is deliberately not
 * escaped, because nothing parses it back. It exists so "same screen" is
 * defined exactly once and every matcher agrees — tab reuse, external-change
 * reconciliation, and the tab bar's width cache all key off this. Splitting
 * that rule across three call sites is how `inventory` would start stealing
 * focus from `inventory:new-a3f9`.
 */
export function refKey(ref: ScreenRef): string {
  return ref.param === undefined
    ? ref.screenType
    : `${ref.screenType}:${ref.param}`
}

/** Whether two refs point at the same screen *and* the same record. */
export function refsEqual(a: ScreenRef, b: ScreenRef): boolean {
  return a.screenType === b.screenType && a.param === b.param
}

function sameTabs(a: Tab[], b: Tab[]): boolean {
  return a.length === b.length && a.every((tab, i) => tab === b[i])
}

/**
 * Rebuild tab identities for a screen list that arrived from *outside* — a
 * refresh, a pasted link, back/forward — reusing ids from `prev` wherever a tab
 * of that ref survives.
 *
 * This is a best guess, and deliberately the *only* place one is made. The
 * workspace's own mutations never come through here: they go through
 * `tabsReducer`, which holds real ids and so knows exactly which tab was
 * closed. Guessing is reserved for content we didn't author, where there is no
 * mounted screen state of ours to protect anyway.
 *
 * The guess: each incoming ref claims the first not-yet-claimed `prev` tab with
 * the same {@link refKey}. That keeps identity stable across the shapes an
 * external change tends to take — a tab added or removed leaves its neighbors'
 * ids alone, and reordering lets ids follow their ref. Where the URL is
 * genuinely ambiguous (`orders,orders` collapsing to `orders`) it picks the
 * leftmost; nothing in the URL can do better, which is exactly why the reducer
 * doesn't rely on it.
 *
 * Matching on the whole ref rather than the screen type is what keeps record
 * tabs apart: `inventory:SKU-001` and `inventory:SKU-002` are two screens of
 * one type, and letting either claim the other's id would hand a refreshed
 * workspace the wrong record's mount.
 *
 * `mint` is injected so this stays pure and its tests stay free of randomness.
 * Returns `prev` itself when the result is identical, giving callers a stable
 * reference to depend on.
 */
export function reconcileIds(
  prev: Tab[],
  refs: ScreenRef[],
  mint: () => string
): Tab[] {
  const claimed = new Array<boolean>(prev.length).fill(false)
  const next = refs.map((ref) => {
    const wanted = refKey(ref)
    const match = prev.findIndex(
      (tab, i) => !claimed[i] && refKey(tab) === wanted
    )
    if (match === -1) return { id: mint(), ...ref }
    claimed[match] = true
    return prev[match]
  })
  return sameTabs(prev, next) ? prev : next
}
