/**
 * How a card of label/input pairs divides them into columns.
 *
 * The card's breakpoints decide how many column *tracks* there are — one, two
 * at `lg`, three at `xl` — and those tracks are always laid down, whether or
 * not there are fields to fill them. What this module decides is which field
 * goes in which track.
 *
 * That is the whole reason the split is done here rather than by the grid. A
 * CSS grid of pairs fills row by row, so seven fields across three tracks come
 * out 3/2/2 — every track short, and the eye reading across a row of unrelated
 * fields. Grouping them first makes each track a column that fills from the
 * top: 4/3/empty. An empty third track is fine; a card of stubs is not.
 *
 * Named for the advanced search card, which asked for this first and is where
 * a field is a *condition*. The record form lays out the same screen's columns
 * the same way and shares it — the rule is about fields, not conditions.
 */

/**
 * How many conditions a column holds before the next one starts.
 *
 * Four is where a column stops being a stub. Below that the card has spread
 * sideways to save a line or two, and the width it spends comes out of the
 * value inputs — the one track with nothing to spare.
 */
export const conditionsPerColumn = 4

/** The most column tracks the card ever lays down, at its widest breakpoint. */
export const maxConditionColumns = 3

/**
 * How deep each column runs.
 *
 * {@link conditionsPerColumn} normally, so columns fill in order and a short
 * card leaves the later tracks empty. Past what the tracks can hold at that
 * depth the columns simply grow instead: there is no fourth track to overflow
 * into, so the depth rises to whatever divides the conditions between three.
 */
export function columnDepth(fields: number): number {
  const safe = Math.max(0, fields)
  return Math.max(conditionsPerColumn, Math.ceil(safe / maxConditionColumns))
}

/**
 * The conditions grouped into their columns — one array per rendered column,
 * in order, with the last one short if the conditions don't divide evenly.
 *
 * Never more than {@link maxConditionColumns} groups, which is what
 * {@link columnDepth} guarantees; fewer whenever the conditions don't reach
 * that far, and the tracks left over stay empty.
 */
export function conditionGroups<T>(items: readonly T[]): T[][] {
  const depth = columnDepth(items.length)
  const groups: T[][] = []
  for (let start = 0; start < items.length; start += depth) {
    groups.push(items.slice(start, start + depth))
  }
  return groups
}
