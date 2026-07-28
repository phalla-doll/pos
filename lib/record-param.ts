/**
 * The `param` half of a record tab's {@link import("@/lib/tab-identity").ScreenRef}.
 *
 * Three kinds, distinguished by a prefix so one field can carry all of them and
 * the URL stays readable
 * (`?tabs=inventory,inventory:new-a3f9,inventory:SKU-001,inventory:delete-SKU-002`):
 *
 * - a **draft** — `new-<token>` — one unsaved record being created. The token
 *   is minted per click and carries no meaning beyond being unlike the last
 *   one, which is precisely what makes every "New" its own tab instead of
 *   reusing the one already open.
 * - a **record id** — the row's key, verbatim. Two clicks on the same row
 *   therefore produce the same ref and land on the same tab, so a record can
 *   never be open in two tabs disagreeing about its contents.
 * - a **deletion** — `delete-<id>` — that same record, opened to be removed
 *   rather than edited. It is deliberately a *different param* from the plain
 *   id: the ref is what the workspace matches on, so "edit SKU-001" and
 *   "delete SKU-001" are two tabs that can be open at once and neither steals
 *   the other's focus. Deleting is the one thing here you might want to read
 *   beside the record rather than instead of it.
 *
 * So a param carries *intent* as well as identity, and it has to: a tab is
 * addressed by nothing else. Holding the intent anywhere but the ref — a second
 * URL param, a flag in React state — would mean a refresh or a pasted link
 * could restore the record without restoring what it was open for.
 *
 * The prefixes are the one ambiguity: a record whose id genuinely began `new-`
 * or `delete-` would be read as the kind it names. That has been true of `new-`
 * since drafts existed and the answer is the same for both — the ids this
 * addresses are SKUs and customer numbers, and a screen whose keys could
 * collide should hand `rowKey` something that can't.
 *
 * Kept apart from the screen registry because it is pure string algebra with
 * no React in it, and because the reuse rules above are the whole feature: they
 * are worth stating in one tested place rather than inline at the call sites.
 */

/**
 * Marks a param as a draft. Trailing `-` so a record whose id is literally
 * `new` can't be mistaken for one — {@link paramKind} tests the prefix, and
 * `"new"` alone doesn't carry it.
 */
const DRAFT_PREFIX = "new-"

/** Marks a param as a record being deleted. Trailing `-` for the same reason. */
const DELETE_PREFIX = "delete-"

/**
 * What a param is for. One three-way answer rather than a pair of predicates:
 * the kinds are exclusive, and a caller that has to ask twice is a caller that
 * can be written to handle a combination which doesn't exist.
 */
export type ParamKind = "draft" | "record" | "delete"

/** Whether `param` carries `prefix` *and* something after it. */
function prefixed(param: string, prefix: string): boolean {
  return param.startsWith(prefix) && param.length > prefix.length
}

/**
 * A fresh draft param. `mint` is injected rather than called here so the
 * module stays deterministic under test — the same reason `tabsReducer` takes
 * its ids from the caller.
 */
export function draftParam(mint: () => string): string {
  return `${DRAFT_PREFIX}${mint()}`
}

/**
 * The param for deleting one record. Not minted, unlike a draft: two clicks on
 * the same row's Delete produce the same param and so land on the tab already
 * open for it. That is the rule editing follows and for the same reason — two
 * tabs each proposing to delete one record is not a state worth reaching.
 */
export function deleteParam(id: string): string {
  return `${DELETE_PREFIX}${id}`
}

/** Which of the three kinds a param is. */
export function paramKind(param: string): ParamKind {
  if (prefixed(param, DRAFT_PREFIX)) return "draft"
  if (prefixed(param, DELETE_PREFIX)) return "delete"
  return "record"
}

/**
 * The record id a param points at, or `null` for a draft.
 *
 * Callers use this to decide what to load, so a draft answering `null` rather
 * than its own token is the point: there is nothing to load for one. A deletion
 * answers the id underneath it — the row it is about to remove is the row it
 * has to show you first.
 */
export function recordId(param: string): string | null {
  switch (paramKind(param)) {
    case "draft":
      return null
    case "delete":
      return param.slice(DELETE_PREFIX.length)
    case "record":
      return param
  }
}
