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
import { ScreenHeader } from "@/components/dashboard/screen-header"
import {
  cycleSort,
  deriveRows,
  type FilterState,
  type ListColumn,
  type SortState,
} from "@/lib/list-rows"

export type { ListColumn }

/**
 * The data shape of a list screen: its columns and rows. The screen's
 * title/description are not repeated here — they live once on the screen
 * registry entry and are passed to {@link ListScreen} as header props.
 */
export type ListScreenConfig<T> = {
  /** Column definitions — drive both the filter bar and the table. */
  columns: ListColumn<T>[]
  /** The rows to display. */
  rows: T[]
  /** Stable row identity for React keys. Defaults to the array index. */
  rowKey?: (row: T, index: number) => React.Key
}

export type ListScreenProps<T> = ListScreenConfig<T> & {
  /** Screen title, shown in the header above the filter bar. */
  label: string
  /** One-line summary, shown beneath the title. */
  description: string
}

/**
 * A registry-driven list page: a screen header, a submit-to-search filter bar
 * with one input per filterable column, and a results table. Filtering is
 * applied only when the user submits the form — typing in an input updates a
 * draft, never the visible rows.
 */
export function ListScreen<T>({
  label,
  description,
  columns,
  rows,
  rowKey,
}: ListScreenProps<T>) {
  const filterable = React.useMemo(
    () => columns.filter((c) => c.filterable !== false),
    [columns]
  )

  // `draft` tracks the inputs; `applied` is what actually filters the table.
  const [draft, setDraft] = React.useState<FilterState>({})
  const [applied, setApplied] = React.useState<FilterState>({})
  const [sort, setSort] = React.useState<SortState | null>(null)

  // The one derivation that answers "which rows, in what order" — used for the
  // count, the empty state, and the table body alike (no filtered/sorted split).
  const visibleRows = React.useMemo(
    () => deriveRows(rows, columns, applied, sort),
    [rows, columns, applied, sort]
  )

  function toggleSort(key: string) {
    setSort((prev) => cycleSort(prev, key))
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
      <ScreenHeader
        label={label}
        description={description}
        actions={
          <span className="text-sm text-muted-foreground tabular-nums">
            {visibleRows.length}{" "}
            {visibleRows.length === 1 ? "result" : "results"}
          </span>
        }
      />

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
            {visibleRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row, index) => (
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
