"use client"

import * as React from "react"
import {
  Archive,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  ClipboardCheck,
  Copy,
  Download,
  Ellipsis,
  FolderInput,
  PackagePlus,
  Plus,
  Printer,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  hasActiveFilter,
  type FilterState,
  type ListColumn,
  type SortState,
} from "@/lib/list-rows"
import {
  emptySelection,
  selectionSummary,
  toggleAll,
  toggleRow,
  type RowKey,
  type SelectionState,
} from "@/lib/list-selection"

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
  /**
   * Stable row identity, used for both React keys and selection. Defaults to
   * the array index — supply a real key if rows can be filtered or sorted, or
   * a selection will follow positions rather than rows.
   */
  rowKey?: (row: T, index: number) => RowKey
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
 * Call-site styling for the header checkbox's indeterminate state: hide the
 * tick and draw a dash instead. The checkbox itself is vendored, so the partial
 * look is composed here rather than by editing `components/ui/checkbox.tsx`.
 */
const indeterminateDash =
  "data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground data-indeterminate:[&_svg]:hidden before:absolute before:hidden before:h-0.5 before:w-2 before:rounded-full before:bg-current data-indeterminate:before:block"

/**
 * The bulk-action bar's contents. Every entry is a UI-only stub until there is
 * a backend — they exist so the selection flow can be demoed end to end — so
 * they carry no handler and are listed as data rather than hand-written twice.
 * Destructive delete and "clear selection" are rendered separately, set apart
 * from these by a divider.
 */
const bulkActions = [
  { label: "Export", icon: Download },
  { label: "Duplicate", icon: Copy },
  { label: "Archive", icon: Archive },
] as const

/** The overflow menu — lower-traffic actions, kept out of the bar itself. */
const bulkMenuActions: {
  label: string
  icon: LucideIcon
  shortcut?: string
}[] = [
  { label: "Assign tag", icon: Tag, shortcut: "⌘T" },
  { label: "Change category", icon: FolderInput },
  { label: "Adjust stock", icon: PackagePlus },
  { label: "Print labels", icon: Printer, shortcut: "⌘P" },
  { label: "Mark as counted", icon: ClipboardCheck },
] as const

/**
 * Whether a click on a row body means "select this row". Clicking the row is a
 * shortcut for its checkbox, but the row is still ordinary text a user may want
 * to read, copy, or interact with — so three cases opt out:
 *
 * - the click ended a drag that highlighted text (the selection is not collapsed)
 * - it is the second click of a double-click, which selects a word
 * - it landed on a control inside a cell (a link, button, or field from a custom
 *   `cell` renderer), whose own behaviour should win
 *
 * Left as a DOM predicate rather than a `lib/` module: it is entirely a question
 * about the event, with no state of ours to reason about.
 */
function isSelectionClick(event: React.MouseEvent<HTMLElement>): boolean {
  if (event.detail > 1) return false
  if (
    (event.target as HTMLElement).closest(
      "a, button, input, select, textarea, [role='checkbox']"
    )
  ) {
    return false
  }
  const selection = window.getSelection()
  return !selection || selection.isCollapsed
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
  const [createDraft, setCreateDraft] = React.useState<Record<string, string>>(
    {}
  )
  const [sort, setSort] = React.useState<SortState | null>(null)
  const [selected, setSelected] = React.useState<SelectionState>(emptySelection)

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

  // Selection is keyed by row identity, so the header checkbox reflects only
  // the rows currently on screen while filtered-out ticks stay put.
  const visibleKeys = React.useMemo(
    () => visibleRows.map((row, index) => rowKey?.(row, index) ?? index),
    [visibleRows, rowKey]
  )
  const headerState = selectionSummary(selected, visibleKeys)
  const selectedCount = selected.size

  function toggleRowSelection(key: RowKey) {
    setSelected((prev) => toggleRow(prev, key))
  }

  function toggleSort(key: string) {
    setSort((prev) => cycleSort(prev, key))
  }

  // Every filter typed outside the advanced panel is a plain substring search.
  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: { op: "contains", value } }))
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

  const filtersActive = hasActiveFilter(filters)
  const hasCreateInput = Object.values(createDraft).some((v) => v.trim() !== "")

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-4 p-4 pt-6">
      <ScreenHeader
        label={label}
        description={description}
        actions={
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Advanced search"
                  />
                }
              >
                <SlidersHorizontal />
                {filtersActive && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />
                )}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 gap-3">
                <PopoverHeader className="flex-row items-center justify-between">
                  <PopoverTitle>Advanced search</PopoverTitle>
                  {filtersActive && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={clearFilters}
                    >
                      Clear
                    </Button>
                  )}
                </PopoverHeader>
                <div className="flex flex-col gap-2.5">
                  {filterable.map((column) => (
                    <div key={column.key} className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`adv-${column.key}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        {column.header}
                      </label>
                      <Input
                        id={`adv-${column.key}`}
                        value={filters[column.key]?.value ?? ""}
                        onChange={(event) =>
                          setFilter(column.key, event.target.value)
                        }
                        placeholder={`Search ${column.header.toLowerCase()}…`}
                      />
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
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
                variant={showCreate ? "secondary" : "default"}
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
              <TableHead className="w-0">
                <Checkbox
                  aria-label="Select all rows"
                  disabled={visibleKeys.length === 0}
                  checked={headerState === "all"}
                  indeterminate={headerState === "some"}
                  onCheckedChange={() =>
                    setSelected((prev) => toggleAll(prev, visibleKeys))
                  }
                  className={indeterminateDash}
                />
              </TableHead>
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
              <TableHead className="w-0" />
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
                          value={filters[column.key]?.value ?? ""}
                          placeholder={`Search ${column.header.toLowerCase()}…`}
                          onChange={(event) =>
                            setFilter(column.key, event.target.value)
                          }
                          className={cn(
                            "pl-7",
                            isLastFilter && filtersActive && "pr-7"
                          )}
                        />
                        {isLastFilter && filtersActive && (
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
                  colSpan={columns.length + 1}
                  className="h-32 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row, index) => {
                const key = visibleKeys[index]
                const checked = selected.has(key)
                return (
                  <TableRow
                    key={key}
                    data-state={checked ? "selected" : undefined}
                    onClick={(event) => {
                      if (isSelectionClick(event)) toggleRowSelection(key)
                    }}
                    className="cursor-pointer"
                  >
                    <TableCell className="w-0">
                      <Checkbox
                        aria-label="Select row"
                        checked={checked}
                        onCheckedChange={() => toggleRowSelection(key)}
                      />
                    </TableCell>
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
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/*
        Bulk-action bar — floats over the table while at least one row is
        ticked. The actions are UI-only stubs until a backend exists; only
        "Clear" does real work.
      */}
      {selectedCount > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 animate-in items-center gap-1 rounded-xl border bg-popover p-1 pl-3 shadow-lg fade-in-0 slide-in-from-bottom-2"
        >
          <span className="text-sm font-medium tabular-nums">
            {selectedCount} selected
          </span>
          <Separator orientation="vertical" className="mx-1 h-5" />
          {bulkActions.map(({ label, icon: Icon }) => (
            <Button key={label} type="button" variant="ghost" size="sm">
              <Icon />
              {label}
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="More actions"
                />
              }
            >
              <Ellipsis />
            </DropdownMenuTrigger>
            {/*
              The popup defaults to the trigger's width (`w-(--anchor-width)`),
              which is one icon button wide — so the labels need an explicit
              width to sit on one line.
            */}
            <DropdownMenuContent align="end" side="top" className="w-52">
              {bulkMenuActions.map(({ label, icon: Icon, shortcut }) => (
                <DropdownMenuItem key={label}>
                  <Icon strokeWidth={1.5} />
                  {label}
                  {shortcut && (
                    <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
            Delete
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Clear selection"
            onClick={() => setSelected(emptySelection)}
          >
            <X />
          </Button>
        </div>
      )}
    </div>
  )
}
