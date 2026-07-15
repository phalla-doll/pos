"use client"

import * as React from "react"
import { Search } from "lucide-react"

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
  /** Horizontal alignment of the header and cells. Defaults to `"left"`. */
  align?: "left" | "right"
}

export type ListScreenConfig<T> = {
  /** Screen title shown above the filter bar. */
  title: string
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
 * A registry-driven list page: a screen title, a submit-to-search filter bar
 * with one input per filterable column, and a results table. Filtering is
 * applied only when the user submits the form — typing in an input updates a
 * draft, never the visible rows.
 */
export function ListScreen<T>({
  title,
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
    const active = filterable.filter((c) => (applied[c.key] ?? "").trim() !== "")
    if (active.length === 0) return rows
    return rows.filter((row) =>
      active.every((c) => matches(row, c, applied[c.key]))
    )
  }, [rows, filterable, applied])

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
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <span className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </span>
      </div>

      {/* Filter bar — one input per filterable column, submit to search. */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border bg-card p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          <Button type="submit">
            <Search />
            Search
          </Button>
        </div>
      </form>

      {/* Results table. */}
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(column.align === "right" && "text-right")}
                >
                  {column.header}
                </TableHead>
              ))}
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
              filtered.map((row, index) => (
                <TableRow key={rowKey?.(row, index) ?? index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(column.align === "right" && "text-right")}
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
