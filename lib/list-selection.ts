/**
 * Row-selection algebra for list screens: which rows are ticked, and what the
 * header's select-all checkbox should show. Selection is keyed by the same row
 * key the table uses for React identity, so it survives filtering and sorting —
 * a row that scrolls out of view because of a filter stays selected.
 */

/** A row's stable identity. Mirrors the subset of `React.Key` we accept. */
export type RowKey = string | number

/** The set of currently selected row keys. */
export type SelectionState = ReadonlySet<RowKey>

/** The shared "nothing selected" value — avoids allocating a Set per screen. */
export const emptySelection: SelectionState = new Set<RowKey>()

/** Tick or untick a single row. Never mutates the incoming set. */
export function toggleRow(
  selected: SelectionState,
  key: RowKey
): SelectionState {
  const next = new Set(selected)
  if (!next.delete(key)) next.add(key)
  return next
}

/**
 * How the header checkbox should render against the rows currently visible:
 * `"all"` when every visible row is ticked, `"none"` when none are, `"some"`
 * in between (the indeterminate dash). An empty table reads as `"none"`.
 */
export function selectionSummary(
  selected: SelectionState,
  visible: readonly RowKey[]
): "none" | "some" | "all" {
  if (visible.length === 0) return "none"
  let hits = 0
  for (const key of visible) if (selected.has(key)) hits++
  if (hits === 0) return "none"
  return hits === visible.length ? "all" : "some"
}

/**
 * The selection a right-click implies, following the convention every file
 * manager uses: right-clicking inside the selection acts on the whole
 * selection, right-clicking outside it drops the selection and targets just
 * that row. Returns the same set when nothing changes, so the common case
 * (right-clicking an already-selected row) re-renders nothing.
 */
export function selectionForMenu(
  selected: SelectionState,
  key: RowKey
): SelectionState {
  return selected.has(key) ? selected : new Set([key])
}

/**
 * The header checkbox's action: select every visible row, or — when they are
 * already all selected — deselect them. Rows hidden by a filter are left
 * untouched either way, so select-all never reaches beyond what the user sees.
 */
export function toggleAll(
  selected: SelectionState,
  visible: readonly RowKey[]
): SelectionState {
  const next = new Set(selected)
  if (selectionSummary(selected, visible) === "all") {
    for (const key of visible) next.delete(key)
  } else {
    for (const key of visible) next.add(key)
  }
  return next
}
