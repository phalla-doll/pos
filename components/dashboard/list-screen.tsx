"use client"

import * as React from "react"
import { ChevronDown, ChevronsUpDown, ChevronUp, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * A single column of a {@link ListScreen}. `get` returns the raw value used
 * for both filtering and default rendering; supply `cell` only when a column
 * needs custom markup (badges, links, formatting). Every column is filterable
 * by default — pass `filterable: false` to drop it from the filter bar.
 */
export type ListColumn<T> = {
  /** Stable key — also the filter field identifier. */
  key: string
  /** Column header text, reused as the filter input's placeholder. */
  header: string
  /** Raw cell value; used for filtering and as the default rendered cell. */
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
type SortState = { key: string; dir: "asc" | "desc" }

export type ListScreenConfig<T> = {
  /** Screen title shown above the filter bar. */
  title: string
  /** One-line summary shown beneath the title. */
  description: string
  /** Column definitions — drive both the filter bar and the table. */
  columns: ListColumn<T>[]
  /** The rows to display. */
  rows: T[]
  /** Stable row identity for React keys. Defaults to the array index. */
  rowKey?: (row: T, index: number) => React.Key
}

/** Case-insensitive "contains" match against a column's raw value. */
function matches<T>(row: T, column: ListColumn<T>, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return String(column.get(row)).toLowerCase().includes(q)
}

/**
 * Compare two raw column values. Numbers sort numerically; everything else
 * sorts as a locale-aware, numeric-aware string (so "10" follows "2").
 */
function compare(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

/**
 * A registry-driven list page: a screen title, a submit-to-search filter bar
 * with one input per filterable column, and a results table. Filtering is
 * applied only when the user submits the form — typing in an input updates a
 * draft, never the visible rows.
 */
export function ListScreen<T>({
  title,
  description,
  columns,
  rows,
  rowKey,
}: ListScreenConfig<T>) {
  const filterable = React.useMemo(
    () => columns.filter((c) => c.filterable !== false),
    [columns]
  )

  // `draft` tracks the inputs; `applied` is what actually filters the table.
  const [draft, setDraft] = React.useState<Record<string, string>>({})
  const [applied, setApplied] = React.useState<Record<string, string>>({})

  const filtered = React.useMemo(() => {
    const active = filterable.filter(
      (c) => (applied[c.key] ?? "").trim() !== ""
    )
    if (active.length === 0) return rows
    return rows.filter((row) =>
      active.every((c) => matches(row, c, applied[c.key]))
    )
  }, [rows, filterable, applied])

  const [sort, setSort] = React.useState<SortState | null>(null)

  const sorted = React.useMemo(() => {
    if (!sort) return filtered
    const column = columns.find((c) => c.key === sort.key)
    if (!column) return filtered
    const factor = sort.dir === "asc" ? 1 : -1
    // Stable sort on a copy; never mutate the incoming rows.
    return [...filtered].sort(
      (a, b) => compare(column.get(a), column.get(b)) * factor
    )
  }, [filtered, columns, sort])

  // Cycle a column: unsorted → ascending → descending → unsorted.
  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" }
      if (prev.dir === "asc") return { key, dir: "desc" }
      return null
    })
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setApplied(draft)
  }

  function handleReset() {
    setDraft({})
    setApplied({})
  }

  const hasActiveFilter = Object.values(applied).some((v) => v.trim() !== "")

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </span>
      </div>

      {/* Filter bar — one input per filterable column, submit to search. */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border bg-card p-4"
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {filterable.map((column) => (
            <div key={column.key} className="flex flex-col gap-1.5">
              <label
                htmlFor={`filter-${column.key}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {column.header}
              </label>
              <Input
                id={`filter-${column.key}`}
                value={draft[column.key] ?? ""}
                placeholder={`Search ${column.header.toLowerCase()}…`}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    [column.key]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          {hasActiveFilter && (
            <Button type="button" variant="ghost" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button type="submit" className="pr-3 pl-2.5">
            <Search />
            Search
          </Button>
        </div>
      </form>

      {/* Results table. */}
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              {columns.map((column) => {
                const active = sort?.key === column.key
                const sortable = column.sortable !== false
                return (
                  <TableHead
                    key={column.key}
                    aria-sort={
                      active
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={cn(
                      column.align === "right" && "text-right tabular-nums"
                    )}
                  >
                    {sortable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "-mx-2.5 h-8 font-medium text-muted-foreground hover:text-foreground",
                          active && "text-foreground"
                        )}
                      >
                        {column.header}
                        {active ? (
                          sort.dir === "asc" ? (
                            <ChevronUp />
                          ) : (
                            <ChevronDown />
                          )
                        ) : (
                          <ChevronsUpDown className="text-muted-foreground/50" />
                        )}
                      </Button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row, index) => (
                <TableRow key={rowKey?.(row, index) ?? index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.align === "right" && "text-right tabular-nums"
                      )}
                    >
                      {column.cell ? column.cell(row) : column.get(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
