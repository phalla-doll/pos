"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Plus,
  Search,
} from "lucide-react"

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

/** The two faces of a creatable list screen, with their toggle icons. */
const MODE_TABS = [
  { value: "search", label: "Search", icon: Search },
  { value: "create", label: "Create", icon: Plus },
] as const

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
  /**
   * Show the Search/Create mode switch above the form. Omit for a
   * search-only screen. Create reuses the same column-driven fields as a
   * blank entry form; submit is a UI-only stub until a backend exists.
   */
  creatable?: boolean
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
  creatable,
}: ListScreenProps<T>) {
  const filterable = React.useMemo(
    () => columns.filter((c) => c.filterable !== false),
    [columns]
  )

  // Which face of the shared form is showing. Search filters the table;
  // Create reuses the same fields as a blank entry form. Local, uncontrolled
  // state — a tab switch remounts the screen and resets this back to "search".
  const [mode, setMode] = React.useState<"search" | "create">("search")
  const isCreate = mode === "create"

  // `draft` tracks the search inputs; `applied` is what actually filters the
  // table. `createDraft` is a separate bucket so filter text and entry text
  // never bleed into each other when toggling modes.
  const [draft, setDraft] = React.useState<FilterState>({})
  const [applied, setApplied] = React.useState<FilterState>({})
  const [createDraft, setCreateDraft] = React.useState<FilterState>({})
  const [justCreated, setJustCreated] = React.useState(false)
  const [sort, setSort] = React.useState<SortState | null>(null)

  // The active field bucket + setter, chosen by mode — the field grid binds
  // to whichever this points at.
  const fieldDraft = isCreate ? createDraft : draft
  const setFieldDraft = isCreate ? setCreateDraft : setDraft

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
    if (isCreate) {
      // UI-only stub: no persistence yet. Clear the form and confirm.
      setCreateDraft({})
      setJustCreated(true)
      return
    }
    setApplied(draft)
  }

  function handleReset() {
    if (isCreate) {
      setCreateDraft({})
      setJustCreated(false)
      return
    }
    setDraft({})
    setApplied({})
  }

  function switchMode(next: "search" | "create") {
    setMode(next)
    setJustCreated(false)
  }

  const hasActiveFilter = Object.values(applied).some((v) => v.trim() !== "")
  const hasCreateInput = Object.values(createDraft).some((v) => v.trim() !== "")
  const showReset = isCreate ? hasCreateInput : hasActiveFilter

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

      {/*
        The shared form: one input per filterable column. In search mode,
        submit applies the filter; in create mode, the same fields act as a
        blank entry form and submit is a stub. The Search/Create switch lives
        inside the card, above the fields.
      */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border bg-card p-4"
      >
        {/* Search / Create mode switch — only on screens that opt in. */}
        {creatable && (
          <Tabs
            value={mode}
            onValueChange={(next) => switchMode(next as "search" | "create")}
          >
            {/* Rounding matches the sidebar theme switcher: see `nav-theme.tsx`. */}
            <TabsList className="rounded-md">
              {MODE_TABS.map(({ value, label: modeLabel, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-sm px-3"
                >
                  <Icon />
                  {modeLabel}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
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
                value={fieldDraft[column.key] ?? ""}
                placeholder={`${isCreate ? "Enter" : "Search"} ${column.header.toLowerCase()}…`}
                onChange={(event) => {
                  const value = event.target.value
                  setFieldDraft((prev) => ({ ...prev, [column.key]: value }))
                  if (isCreate) setJustCreated(false)
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2">
          {isCreate && justCreated && (
            <p className="mr-auto text-sm text-muted-foreground">
              Item created — not yet persisted.
            </p>
          )}
          {showReset && (
            <Button type="button" variant="ghost" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button type="submit" className="pr-3 pl-2.5">
            {isCreate ? <Plus /> : <Search />}
            {isCreate ? "Create" : "Search"}
          </Button>
        </div>
      </form>

      {/* Results table — always shown; the Create toggle only swaps the form. */}
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
