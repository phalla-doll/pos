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

/** How a filter value is tested against a column's raw value. */
export type FilterOperator =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"

/** One column's filter: the test to apply, and the value to test against. */
export type FilterCondition = { op: FilterOperator; value: string }

/** The applied filter per column key. */
export type FilterState = Record<string, FilterCondition>

/**
 * Whether a column reads as numbers or as text, decided from the first row —
 * the column's own values are the only evidence available, and a list's rows
 * are homogeneous. An empty list reads as text, the more permissive default.
 */
export function columnKind<T>(
  column: ListColumn<T>,
  rows: readonly T[]
): "number" | "text" {
  return rows.length > 0 && typeof column.get(rows[0]) === "number"
    ? "number"
    : "text"
}

/**
 * The operators offered for a column, in menu order. Each carries a `label`
 * for the menu and a `short` glyph for the inline addon inside the input,
 * which has room for a word at most.
 */
export const operatorsByKind: Record<
  "number" | "text",
  readonly { op: FilterOperator; label: string; short: string }[]
> = {
  text: [
    { op: "contains", label: "Contains", short: "contains" },
    { op: "notContains", label: "Does not contain", short: "excludes" },
    { op: "equals", label: "Equals", short: "is" },
    { op: "notEquals", label: "Does not equal", short: "is not" },
    { op: "startsWith", label: "Starts with", short: "starts" },
    { op: "endsWith", label: "Ends with", short: "ends" },
  ],
  number: [
    { op: "equals", label: "Equals", short: "=" },
    { op: "notEquals", label: "Does not equal", short: "≠" },
    { op: "gt", label: "Greater than", short: ">" },
    { op: "gte", label: "Greater than or equal", short: "≥" },
    { op: "lt", label: "Less than", short: "<" },
    { op: "lte", label: "Less than or equal", short: "≤" },
    { op: "contains", label: "Contains", short: "contains" },
  ],
}

/** The operator a column starts on — the first one it offers. */
export function defaultOperator<T>(
  column: ListColumn<T>,
  rows: readonly T[]
): FilterOperator {
  return operatorsByKind[columnKind(column, rows)][0].op
}

/** A condition only filters once it has a value to test against. */
export function isActive(condition: FilterCondition | undefined): boolean {
  return (condition?.value ?? "").trim() !== ""
}

/** Whether any column currently filters the table. */
export function hasActiveFilter(state: FilterState): boolean {
  return Object.values(state).some(isActive)
}

/**
 * Compare a cell against a filter value for the ordering operators. Both sides
 * parse as numbers → numeric comparison, so `stock > 9` doesn't rank "10"
 * below "9"; otherwise fall back to the same locale-aware string ordering the
 * sort uses, which keeps `>` meaningful on text columns.
 */
function compareToFilter(cell: string | number, value: string): number {
  const cellNum = typeof cell === "number" ? cell : Number(cell)
  const valueNum = Number(value)
  if (
    !Number.isNaN(cellNum) &&
    !Number.isNaN(valueNum) &&
    value.trim() !== ""
  ) {
    return cellNum - valueNum
  }
  return compare(String(cell), value)
}

/**
 * Test one row against one column's condition. A blank value matches
 * everything — a half-typed filter should not empty the table — and text
 * comparisons are case-insensitive throughout.
 */
export function matches<T>(
  row: T,
  column: ListColumn<T>,
  condition: FilterCondition | undefined
): boolean {
  if (!isActive(condition)) return true
  const { op, value } = condition!
  const raw = column.get(row)
  const cell = String(raw).toLowerCase()
  const query = value.trim().toLowerCase()

  switch (op) {
    case "contains":
      return cell.includes(query)
    case "notContains":
      return !cell.includes(query)
    case "equals":
      return cell === query
    case "notEquals":
      return cell !== query
    case "startsWith":
      return cell.startsWith(query)
    case "endsWith":
      return cell.endsWith(query)
    case "gt":
      return compareToFilter(raw, value.trim()) > 0
    case "gte":
      return compareToFilter(raw, value.trim()) >= 0
    case "lt":
      return compareToFilter(raw, value.trim()) < 0
    case "lte":
      return compareToFilter(raw, value.trim()) <= 0
  }
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
 * filter the rows by every active column query and the global `query` (which
 * matches any filterable column), then (if sorting) stably sort a copy by the
 * sort column. Never mutates the incoming rows. This single value backs the
 * count, the empty state, and the table body alike — there is no separate
 * `filtered` vs `sorted` to drift apart.
 */
export function deriveRows<T>(
  rows: T[],
  columns: ListColumn<T>[],
  applied: FilterState,
  sort: SortState | null,
  query = ""
): T[] {
  const active = columns.filter(
    (c) => c.filterable !== false && isActive(applied[c.key])
  )
  // The global query matches a row when *any* filterable column contains it.
  const q = query.trim()
  const searchable =
    q === "" ? [] : columns.filter((c) => c.filterable !== false)
  const anywhere: FilterCondition = { op: "contains", value: q }

  const filtered =
    active.length === 0 && q === ""
      ? rows
      : rows.filter(
          (row) =>
            active.every((c) => matches(row, c, applied[c.key])) &&
            (q === "" || searchable.some((c) => matches(row, c, anywhere)))
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
 * Rows as tab-separated text, one line each, in column order — the format a
 * spreadsheet pastes into as cells rather than as one blob. Uses the raw `get`
 * value, not the rendered cell, so what lands on the clipboard is the data.
 */
export function toClipboardText<T>(
  rows: readonly T[],
  columns: readonly ListColumn<T>[]
): string {
  return rows
    .map((row) => columns.map((column) => String(column.get(row))).join("\t"))
    .join("\n")
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
