/**
 * What a delete confirmation needs to say. The dialog's job is to make the
 * blast radius unambiguous *before* the click, so this module answers the
 * three questions a user actually has: how many rows, which ones, and is
 * anything in there I can't currently see.
 *
 * That last one matters because selection survives filtering (see
 * `lib/list-selection.ts`): a user can tick rows, narrow the filter, and hit
 * Delete with rows targeted that are nowhere on screen. The dialog says so
 * rather than letting the count quietly disagree with the table.
 */

import type { ListColumn } from "./list-rows"
import type { RowKey, SelectionState } from "./list-selection"

/** One row as the dialog lists it: a name, plus a little identifying context. */
export type DeletePreviewRow = {
  key: RowKey
  /** The first column's value — what the row is called. */
  primary: string
  /** A few more columns, so near-identical names stay tellable apart. */
  details: { label: string; value: string }[]
}

/** Everything the confirmation dialog renders, derived in one pass. */
export type DeletePlan = {
  /** How many rows the confirm button will delete. */
  count: number
  /** The rows listed in full, capped at the preview limit. */
  preview: DeletePreviewRow[]
  /** Targeted rows beyond the preview — summarised as "and N more". */
  more: number
  /** Targeted rows hidden by the current filter. */
  hidden: number
}

export type DeletePlanInput<T> = {
  /** Every row on the screen, filtered or not. */
  rows: readonly T[]
  /** `rows[i]`'s identity — same keys the table and selection use. */
  keys: readonly RowKey[]
  columns: readonly ListColumn<T>[]
  /** The rows to delete. */
  targets: SelectionState
  /** The keys currently passing the filter, for the hidden-rows count. */
  visible: readonly RowKey[]
  /** How many rows to list before collapsing the rest into `more`. */
  limit?: number
  /** How many columns of context to show beside each row's name. */
  detailColumns?: number
}

/**
 * Build the confirmation's contents. Rows are listed in table order rather
 * than selection order, so the dialog reads like the table it came from.
 * Targets with no matching row (a stale key) are ignored — the plan describes
 * what can actually be deleted, not what was asked for.
 */
export function deletePlan<T>({
  rows,
  keys,
  columns,
  targets,
  visible,
  limit = 5,
  detailColumns = 2,
}: DeletePlanInput<T>): DeletePlan {
  const visibleKeys = new Set(visible)
  const [nameColumn, ...rest] = columns
  const detailCols = rest.slice(0, detailColumns)

  const preview: DeletePreviewRow[] = []
  let count = 0
  let hidden = 0

  rows.forEach((row, index) => {
    const key = keys[index]
    if (!targets.has(key)) return
    count++
    if (!visibleKeys.has(key)) hidden++
    if (preview.length < limit) {
      preview.push({
        key,
        primary: nameColumn ? String(nameColumn.get(row)) : String(key),
        details: detailCols.map((column) => ({
          label: column.header,
          value: String(column.get(row)),
        })),
      })
    }
  })

  return { count, preview, more: count - preview.length, hidden }
}
