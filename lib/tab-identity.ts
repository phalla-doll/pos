import type { ScreenType } from "@/lib/screens"

/**
 * A single open tab. `screenType` is what the URL carries; `id` is a runtime
 * instance handle that exists only so the workspace can key its remounts on
 * it (and so the tab bar can address a specific tab when the same screen is
 * open twice).
 */
export type Tab = {
  id: string
  screenType: ScreenType
}

function sameTabs(a: Tab[], b: Tab[]): boolean {
  return a.length === b.length && a.every((tab, i) => tab === b[i])
}

/**
 * Rebuild tab identities for a screen list that arrived from *outside* —  a
 * refresh, a pasted link, back/forward — reusing ids from `prev` wherever a tab
 * of that type survives.
 *
 * This is a best guess, and deliberately the *only* place one is made. The
 * workspace's own mutations never come through here: they go through
 * `tabsReducer`, which holds real ids and so knows exactly which tab was
 * closed. Guessing is reserved for content we didn't author, where there is no
 * mounted screen state of ours to protect anyway.
 *
 * The guess: each incoming type claims the first not-yet-claimed `prev` tab of
 * the same type. That keeps identity stable across the shapes an external
 * change tends to take — a tab added or removed leaves its neighbors' ids
 * alone, and reordering lets ids follow their type. Where the URL is genuinely
 * ambiguous (`orders,orders` collapsing to `orders`) it picks the leftmost;
 * nothing in the URL can do better, which is exactly why the reducer doesn't
 * rely on it.
 *
 * `mint` is injected so this stays pure and its tests stay free of randomness.
 * Returns `prev` itself when the result is identical, giving callers a stable
 * reference to depend on.
 */
export function reconcileIds(
  prev: Tab[],
  types: ScreenType[],
  mint: () => string
): Tab[] {
  const claimed = new Array<boolean>(prev.length).fill(false)
  const next = types.map((screenType) => {
    const match = prev.findIndex(
      (tab, i) => !claimed[i] && tab.screenType === screenType
    )
    if (match === -1) return { id: mint(), screenType }
    claimed[match] = true
    return prev[match]
  })
  return sameTabs(prev, next) ? prev : next
}
