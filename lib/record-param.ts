/**
 * The `param` half of a record tab's {@link import("@/lib/tab-identity").ScreenRef}.
 *
 * Two kinds, distinguished by a prefix so one field can carry both and the URL
 * stays readable (`?tabs=inventory,inventory:new-a3f9,inventory:SKU-001`):
 *
 * - a **draft** — `new-<token>` — one unsaved record being created. The token
 *   is minted per click and carries no meaning beyond being unlike the last
 *   one, which is precisely what makes every "New" its own tab instead of
 *   reusing the one already open.
 * - a **record id** — the row's key, verbatim. Two clicks on the same row
 *   therefore produce the same ref and land on the same tab, so a record can
 *   never be open in two tabs disagreeing about its contents.
 *
 * Kept apart from the screen registry because it is pure string algebra with
 * no React in it, and because the reuse rule above is the whole feature: it is
 * worth stating in one tested place rather than inline at the call sites.
 */

/**
 * Marks a param as a draft. Trailing `-` so a record whose id is literally
 * `new` can't be mistaken for one — {@link isDraft} tests the prefix, and
 * `"new"` alone doesn't carry it.
 */
const DRAFT_PREFIX = "new-"

/**
 * A fresh draft param. `mint` is injected rather than called here so the
 * module stays deterministic under test — the same reason `tabsReducer` takes
 * its ids from the caller.
 */
export function draftParam(mint: () => string): string {
  return `${DRAFT_PREFIX}${mint()}`
}

/** Whether a param names an unsaved new record rather than an existing one. */
export function isDraft(param: string): boolean {
  return param.startsWith(DRAFT_PREFIX) && param.length > DRAFT_PREFIX.length
}

/**
 * The record id a param points at, or `null` for a draft.
 *
 * Callers use this to decide what to load, so a draft answering `null` rather
 * than its own token is the point: there is nothing to load for one.
 */
export function recordId(param: string): string | null {
  return isDraft(param) ? null : param
}
