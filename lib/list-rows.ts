import type React from "react"

/**
 * A single column of a list screen. `get` returns the raw value used for both
 * filtering and default rendering; supply `cell` only when a column needs
 * custom markup (badges, links, formatting). Every column is filterable and
 * sortable by default — opt out with `filterable: false` / `sortable: false`.
 */
export type ListColumn<T> = {
  /** Stable key — also the filter field identifier. */
  key: string
  /** Column header text, reused as the filter input's placeholder. */
  header: string
  /** Raw cell value; used for filtering, sorting, and the default cell. */
  get: (row: T) => string | number
  /** Optional custom cell renderer. Falls back to `get` when omitted. */
  cell?: (row: T) => React.ReactNode
  /** Whether this column appears in the filter bar. Defaults to `true`. */
  filterable?: boolean
  /** Whether this column's header can sort the table. Defaults to `true`. */
  sortable?: boolean
  /** Horizontal alignment of the header and cells. Defaults to `"left"`. */
  align?: "left" | "right"
}

/** Active sort: which column, in which direction. */
export type SortState = { key: string; dir: "asc" | "desc" }

/** The applied filter query per column key. */
export type FilterState = Record<string, string>

/** Case-insensitive "contains" match against a column's raw value. */
export function matches<T>(
  row: T,
  column: ListColumn<T>,
  query: string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return String(column.get(row)).toLowerCase().includes(q)
}

/**
 * Compare two raw column values. Numbers sort numerically; everything else
 * sorts as a locale-aware, numeric-aware string (so "10" follows "2").
 */
export function compare(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

/**
 * The whole "what rows do you see and in what order" question, answered once:
 * filter the rows by every active column query, then (if sorting) stably sort
 * a copy by the sort column. Never mutates the incoming rows. This single
 * value backs the count, the empty state, and the table body alike — there is
 * no separate `filtered` vs `sorted` to drift apart.
 */
export function deriveRows<T>(
  rows: T[],
  columns: ListColumn<T>[],
  applied: FilterState,
  sort: SortState | null
): T[] {
  const active = columns.filter(
    (c) => c.filterable !== false && (applied[c.key] ?? "").trim() !== ""
  )
  const filtered =
    active.length === 0
      ? rows
      : rows.filter((row) =>
          active.every((c) => matches(row, c, applied[c.key]))
        )

  if (!sort) return filtered
  const column = columns.find((c) => c.key === sort.key)
  if (!column) return filtered
  const factor = sort.dir === "asc" ? 1 : -1
  return [...filtered].sort(
    (a, b) => compare(column.get(a), column.get(b)) * factor
  )
}

/**
 * Advance the sort state for a clicked column header, cycling
 * unsorted → ascending → descending → unsorted.
 */
export function cycleSort(
  prev: SortState | null,
  key: string
): SortState | null {
  if (prev?.key !== key) return { key, dir: "asc" }
  if (prev.dir === "asc") return { key, dir: "desc" }
  return null
}
