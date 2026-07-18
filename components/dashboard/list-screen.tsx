"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Plus,
  Search,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
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
  /** Column definitions — drive both the filter row and the table. */
  columns: ListColumn<T>[]
  /** The rows to display. */
  rows: T[]
  /** Stable row identity for React keys. Defaults to the array index. */
  rowKey?: (row: T, index: number) => React.Key
  /**
   * Show a "New" button that reveals a column-driven create form. Omit for a
   * read-only screen. Submit is a UI-only stub until a backend exists.
   */
  creatable?: boolean
}

export type ListScreenProps<T> = ListScreenConfig<T> & {
  /** Screen title, shown in the header above the table. */
  label: string
  /** One-line summary, shown beneath the title. */
  description: string
}

/**
 * A registry-driven list page: a screen header and a results table whose first
 * row is a fixed, per-column search bar. Typing in a column's input filters the
 * table live — there is no submit step. Creatable screens also get a "New"
 * button that toggles a column-driven entry form above the table.
 */
export function ListScreen<T>({
  label,
  description,
  columns,
  rows,
  rowKey,
  creatable,
}: ListScreenProps<T>) {
  // `filters` is the live per-column search query and `query` is the global
  // "search any column" box in the header — both filter the table on every
  // keystroke. `createDraft` is a separate bucket so search text and entry
  // text never bleed into each other.
  const [filters, setFilters] = React.useState<FilterState>({})
  const [query, setQuery] = React.useState("")
  const [createDraft, setCreateDraft] = React.useState<FilterState>({})
  const [sort, setSort] = React.useState<SortState | null>(null)

  // The create form is hidden until the user opts in via the "New" button.
  const [showCreate, setShowCreate] = React.useState(false)
  const [justCreated, setJustCreated] = React.useState(false)

  const filterable = React.useMemo(
    () => columns.filter((c) => c.filterable !== false),
    [columns]
  )

  // The one derivation that answers "which rows, in what order" — used for the
  // count, the empty state, and the table body alike (no filtered/sorted split).
  const visibleRows = React.useMemo(
    () => deriveRows(rows, columns, filters, sort, query),
    [rows, columns, filters, sort, query]
  )

  function toggleSort(key: string) {
    setSort((prev) => cycleSort(prev, key))
  }

  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters({})
  }

  function handleCreateSubmit(event: React.FormEvent) {
    event.preventDefault()
    // UI-only stub: no persistence yet. Clear the form and confirm.
    setCreateDraft({})
    setJustCreated(true)
  }

  function toggleCreate() {
    setShowCreate((prev) => !prev)
    setJustCreated(false)
  }

  const hasActiveFilter = Object.values(filters).some((v) => v.trim() !== "")
  const hasCreateInput = Object.values(createDraft).some((v) => v.trim() !== "")

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-6">
      <ScreenHeader
        label={label}
        description={description}
        actions={
          <div className="flex items-center gap-2">
            <InputGroup className="w-56 sm:w-64">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search all columns"
                placeholder="Search…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </InputGroup>
            {creatable && (
              <Button
                type="button"
                variant={showCreate ? "secondary" : "outline"}
                size="sm"
                onClick={toggleCreate}
                className="pr-3 pl-2.5"
              >
                <Plus />
                New
              </Button>
            )}
          </div>
        }
      />

      {/*
        Create form — a blank entry form that reuses the same column-driven
        fields as the search row. Shown only when the user clicks "New" on a
        creatable screen. Submit is a stub until a backend exists.
      */}
      {creatable && showCreate && (
        <form
          onSubmit={handleCreateSubmit}
          className="flex flex-col gap-4 rounded-xl border bg-card p-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filterable.map((column) => (
              <div key={column.key} className="flex flex-col gap-1.5">
                <label
                  htmlFor={`create-${column.key}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  {column.header}
                </label>
                <Input
                  id={`create-${column.key}`}
                  value={createDraft[column.key] ?? ""}
                  placeholder={`Enter ${column.header.toLowerCase()}…`}
                  onChange={(event) => {
                    setCreateDraft((prev) => ({
                      ...prev,
                      [column.key]: event.target.value,
                    }))
                    setJustCreated(false)
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2">
            {justCreated && (
              <p className="mr-auto text-sm text-muted-foreground">
                Item created — not yet persisted.
              </p>
            )}
            {hasCreateInput && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreateDraft({})
                  setJustCreated(false)
                }}
              >
                Reset
              </Button>
            )}
            <Button type="submit" className="pr-3 pl-2.5">
              <Plus />
              Create
            </Button>
          </div>
        </form>
      )}

      {/* Results table — the first row is a fixed, live per-column search bar. */}
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="hover:bg-transparent">
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
            {/*
              The fixed search row: one input per filterable column, filtering
              the table live. It sticks under the header while the body scrolls.
            */}
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => {
                const canFilter = column.filterable !== false
                // The last filterable input hosts the clear-all button so it
                // never needs a column of its own.
                const isLastFilter =
                  canFilter &&
                  filterable[filterable.length - 1]?.key === column.key
                return (
                  <TableHead key={column.key} className="py-1.5">
                    {canFilter ? (
                      <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          aria-label={`Search ${column.header}`}
                          value={filters[column.key] ?? ""}
                          placeholder={`Search ${column.header.toLowerCase()}…`}
                          onChange={(event) =>
                            setFilter(column.key, event.target.value)
                          }
                          className={cn(
                            "pl-7",
                            isLastFilter && hasActiveFilter && "pr-7"
                          )}
                        />
                        {isLastFilter && hasActiveFilter && (
                          <button
                            type="button"
                            onClick={clearFilters}
                            aria-label="Clear all filters"
                            className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ) : null}
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
