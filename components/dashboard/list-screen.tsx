"use client"

import * as React from "react"
import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Check,
  ClipboardCopy,
  ClipboardCheck,
  Copy,
  Download,
  Ellipsis,
  FolderInput,
  PackagePlus,
  Plus,
  Printer,
  Search,
  SquareCheck,
  Tag,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
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
  columnKind,
  cycleSort,
  deriveRows,
  hasActiveFilter,
  operatorsByKind,
  toClipboardText,
  type FilterOperator,
  type FilterState,
  type ListColumn,
  type SortState,
} from "@/lib/list-rows"
import { deletePlan } from "@/lib/list-delete"
import {
  defaultPageSize,
  pageSizes,
  pageSlice,
  pageWindow,
  paginate,
  rescalePage,
} from "@/lib/list-pagination"
import {
  emptySelection,
  selectionForMenu,
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
 * "Copy row" / "Copy 3 rows" — a menu item names what it will actually act on,
 * which for a multi-row selection is not just the row under the cursor.
 */
function rowWord(verb: string, count: number): string {
  return count > 1 ? `${verb} ${count} rows` : `${verb} row`
}

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
  // `filters` is what the table is filtered by right now, applied on every
  // keystroke of the per-column row. `createDraft` is a separate bucket so
  // search text and entry text never bleed into each other.
  const [filters, setFilters] = React.useState<FilterState>({})
  const [createDraft, setCreateDraft] = React.useState<Record<string, string>>(
    {}
  )
  const [sort, setSort] = React.useState<SortState | null>(null)
  const [selected, setSelected] = React.useState<SelectionState>(emptySelection)

  // Delete is the one action that can't be undone by clicking again, so it
  // goes through a confirmation that spells out exactly which rows it means.
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)

  // The advanced panel edits a *draft* of the same filters and only commits it
  // on Apply, so a half-built query never disturbs the table underneath. It is
  // seeded from the live filters each time the panel opens, which is what makes
  // the two surfaces one filter set rather than two.
  const [advancedOpen, setAdvancedOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<FilterState>({})

  // Only the *request* is stored. `paginate` clamps it against the row count
  // on every render, so a filter that shrinks the results simply answers a
  // lower page — no effect has to notice and reset anything after the fact.
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState<number>(defaultPageSize)
  const pageSizeId = React.useId()

  // The per-column search row is view chrome, not workspace content, so it
  // stays local rather than going in the URL — a collapsed row is not part of
  // what a shared link should restore. It resets on tab switch along with the
  // rest of the screen's state, which the `key={activeTab.id}` remount implies.
  const [showFilters, setShowFilters] = React.useState(false)
  const filterRowId = React.useId()

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
    () => deriveRows(rows, columns, filters, sort),
    [rows, columns, filters, sort]
  )

  // Keys for every row that survives the filters, across all pages — the basis
  // for copying and for the delete dialog, neither of which should forget a
  // selected row just because the user paged away from it.
  const visibleKeys = React.useMemo(
    () => visibleRows.map((row, index) => rowKey?.(row, index) ?? index),
    [visibleRows, rowKey]
  )

  // The page currently rendered. `pagination` is derived, never stored, so it
  // is always consistent with however many rows the filters left behind.
  // Memoised on the row *count* rather than the rows: a new array with the
  // same length can't change the arithmetic, and a stable result is what lets
  // the slice below memoise at all.
  const pagination = React.useMemo(
    () => paginate(visibleRows.length, page, pageSize),
    [visibleRows.length, page, pageSize]
  )
  const pageRows = React.useMemo(
    () => pageSlice(visibleRows, pagination),
    [visibleRows, pagination]
  )
  const pageKeys = visibleKeys.slice(pagination.start, pagination.end)

  // The header checkbox is scoped to the page, not to the whole result set:
  // it sits at the top of these rows, so "select all" has to mean the rows
  // underneath it. Ticks on other pages survive untouched, which is the same
  // rule filtered-out rows already followed.
  const headerState = selectionSummary(selected, pageKeys)
  const selectedCount = selected.size

  // Deletion reaches every selected row, including ones a filter is currently
  // hiding — so the plan is built from *all* rows, with the visible keys passed
  // in only so the dialog can warn about the rows off screen.
  const allKeys = React.useMemo(
    () => rows.map((row, index) => rowKey?.(row, index) ?? index),
    [rows, rowKey]
  )
  const plan = React.useMemo(
    () =>
      deletePlan({
        rows,
        keys: allKeys,
        columns,
        targets: selected,
        visible: visibleKeys,
      }),
    [rows, allKeys, columns, selected, visibleKeys]
  )

  function toggleRowSelection(key: RowKey) {
    setSelected((prev) => toggleRow(prev, key))
  }

  // The one context-menu action that isn't a stub. Clipboard access can be
  // refused (an insecure origin, or a denied permission) and there is nowhere
  // to report that yet, so a failure is swallowed rather than thrown at React.
  async function copyRows(keys: RowKey[]) {
    const wanted = new Set(keys)
    const picked = visibleRows.filter((_, index) =>
      wanted.has(visibleKeys[index])
    )
    try {
      await navigator.clipboard?.writeText(toClipboardText(picked, columns))
    } catch {
      // ignored — copying is a convenience, not a state change
    }
  }

  // UI-only stub, like the rest of the bulk actions: there is no backend to
  // delete from, so confirming just closes the dialog and drops the selection.
  function confirmDelete() {
    setSelected(emptySelection)
    setConfirmingDelete(false)
  }

  function toggleSort(key: string) {
    setSort((prev) => cycleSort(prev, key))
  }

  // The inline row is the quick path: it always searches for a substring, so
  // typing there resets that column to `contains` rather than silently reusing
  // an operator the user picked in the panel and can't see from here.
  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: { op: "contains", value } }))
  }

  function clearFilters() {
    setFilters({})
    setDraft({})
  }

  function openAdvanced(open: boolean) {
    if (open) setDraft(filters)
    setAdvancedOpen(open)
  }

  function setDraftValue(key: string, value: string, fallback: FilterOperator) {
    setDraft((prev) => ({
      ...prev,
      [key]: { op: prev[key]?.op ?? fallback, value },
    }))
  }

  function setDraftOperator(key: string, op: FilterOperator) {
    setDraft((prev) => ({
      ...prev,
      [key]: { op, value: prev[key]?.value ?? "" },
    }))
  }

  function applyAdvanced(event: React.FormEvent) {
    event.preventDefault()
    setFilters(draft)
    setAdvancedOpen(false)
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
  const draftActive = hasActiveFilter(draft)
  const hasCreateInput = Object.values(createDraft).some((v) => v.trim() !== "")

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-4 p-4 pt-6">
      <ScreenHeader
        label={label}
        description={description}
        actions={
          <div className="flex items-center gap-2">
            <Popover open={advancedOpen} onOpenChange={openAdvanced}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="pr-3 pl-2.5"
                  />
                }
              >
                <Search />
                Search
                {/*
                  Inline rather than a corner badge: the dot marks a filter set
                  that the panel is currently hiding, and reading in the flow of
                  the label is what makes it a caption on the button instead of
                  decoration floating beside it.
                */}
                {filtersActive && (
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-primary"
                  />
                )}
              </PopoverTrigger>
              {/*
                Each row is one condition — operator and value in a single
                field, the operator as an inline addon rather than a separate
                control beside the input. Nothing here touches the table until
                Apply.
              */}
              <PopoverContent align="start" className="w-[28rem] gap-0 p-0">
                <form onSubmit={applyAdvanced} className="flex flex-col">
                  {/*
                    `items-start` rather than `items-center`: the header is now
                    two lines tall, and Clear belongs beside the title it sits
                    with, not centred against the description below it.
                  */}
                  <PopoverHeader className="flex-row items-start justify-between gap-4 px-4 pt-3 pb-2.5">
                    <div className="flex flex-col gap-1">
                      <PopoverTitle>Search</PopoverTitle>
                      {/*
                        Says the thing the panel does not show on its own: that
                        the conditions combine rather than replacing each other.
                      */}
                      <PopoverDescription>
                        Match on several columns at once.
                      </PopoverDescription>
                    </div>
                    {draftActive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        // Shifted up to sit on the title's line, undoing the
                        // button's own vertical slack against a one-line title.
                        className="-mt-0.5 shrink-0"
                        onClick={() => setDraft({})}
                      >
                        Clear
                      </Button>
                    )}
                  </PopoverHeader>
                  {/*
                    A wide table has more columns than fit on screen, so the
                    conditions scroll and the footer stays put — Apply must
                    never be the thing that gets pushed out of view.
                  */}
                  {/*
                    One grid rather than a stack of per-row flexes: the label
                    column is shared, so every field starts at the same x no
                    matter how long its header is.

                    `fit-content(8rem)` sizes that column to the longest label
                    instead of a fixed width. A fixed one sets the gap to
                    `width - label + gap`, so it grew as labels got shorter and
                    "SKU" sat nearly twice as far from its field as "Category"
                    did. Sizing to content makes the *widest* label define the
                    column, so the tightest row is exactly `gap-x` and no row
                    is arbitrarily loose. The 8rem cap keeps one long header
                    from eating the input's width; `truncate` handles the rest.

                    `minmax(0,1fr)` lets the input column actually shrink — a
                    bare `1fr` floors at the input's intrinsic width and would
                    push the panel wider.
                  */}
                  <div className="grid max-h-[min(26rem,50vh)] grid-cols-[fit-content(8rem)_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 overflow-y-auto px-4 pt-0.5 pb-4">
                    {filterable.map((column) => {
                      const operators =
                        operatorsByKind[columnKind(column, rows)]
                      const active =
                        operators.find((o) => o.op === draft[column.key]?.op) ??
                        operators[0]
                      return (
                        <React.Fragment key={column.key}>
                          {/*
                            `text-sm`, matching the input beside it. At `text-xs`
                            the label read as a caption *about* the field rather
                            than the field's name — which is what it was when it
                            sat above the input, but not what it is on a shared
                            row where the eye compares the two directly.
                          */}
                          <label
                            htmlFor={`adv-${column.key}`}
                            className="truncate text-sm font-medium"
                          >
                            {column.header}
                          </label>
                          <InputGroup>
                            <InputGroupAddon className="mr-1 border-r border-input py-0 pr-0">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <InputGroupButton
                                      aria-label={`${column.header} operator`}
                                      // A fixed width so every field's divider
                                      // lands in the same place — "=" and
                                      // "contains" must not stagger the inputs.
                                      className="mr-1.5 w-20 justify-between font-normal"
                                    />
                                  }
                                >
                                  {active.short}
                                  <ChevronDown className="text-muted-foreground/70" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="start"
                                  className="w-56"
                                >
                                  {operators.map((operator) => (
                                    <DropdownMenuItem
                                      key={operator.op}
                                      onClick={() =>
                                        setDraftOperator(
                                          column.key,
                                          operator.op
                                        )
                                      }
                                    >
                                      <span className="w-14 shrink-0 text-muted-foreground">
                                        {operator.short}
                                      </span>
                                      {operator.label}
                                      {operator.op === active.op && (
                                        <Check className="ml-auto" />
                                      )}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </InputGroupAddon>
                            <InputGroupInput
                              id={`adv-${column.key}`}
                              value={draft[column.key]?.value ?? ""}
                              onChange={(event) =>
                                setDraftValue(
                                  column.key,
                                  event.target.value,
                                  active.op
                                )
                              }
                              // The label beside it already names the column,
                              // so repeating the header here would say the
                              // same word twice on one row.
                              placeholder="Value…"
                            />
                          </InputGroup>
                        </React.Fragment>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                    {filtersActive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mr-auto"
                        onClick={clearFilters}
                      >
                        Reset all
                      </Button>
                    )}
                    <Button type="submit" className="pr-3 pl-2.5">
                      <Search />
                      Apply
                    </Button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>
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
      {/*
        Body rows sit a notch below the table's `text-sm`: the header, filter
        row, and controls keep that size, so shrinking only the data lets a
        wide table fit more per screen without the chrome shrinking with it.
        The line-height stays inherited, which keeps the rows from tightening.

        `py-1.5` trims the cell padding to match — vertical only, since the
        horizontal padding is shared with the header cells above and changing
        it here would knock the columns out of alignment with them.
      */}
      {/*
        `overflow-visible` on the table's own container is what makes the
        sticky header work. `Table` wraps itself in an `overflow-x-auto` div,
        and a box with `overflow-x: auto` computes `overflow-y` to `auto` as
        well — so that div, not this one, became the scroll box the sticky
        `thead` measured itself against. It never scrolls vertically, so the
        header had nothing to stick to and scrolled away with the rows.
        Neutralising it hands both axes back to this container.
      */}
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card [&_[data-slot=table-container]]:overflow-visible [&_td]:py-1.5 [&_td]:text-[0.8125rem] [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
        <Table>
          {/*
            The bottom rule is drawn as an inset shadow on the last header
            row's cells, not with the `border-b` the rows already carry: the
            table collapses its borders, and a collapsed border on a sticky
            section is painted with the rows it was merged into, so it slides
            away under the header the moment the body scrolls. A shadow is not
            part of the border-collapse model, so it stays put.

            That row's own border is then dropped, or the two stack into a
            2px rule while the table sits unscrolled. Only the last row is
            treated this way — any row above it is not the one meeting the
            body, so it keeps the ordinary border that separates the two
            header rows from each other.
          */}
          <TableHeader className="sticky top-0 z-10 bg-card [&_tr:last-child]:border-b-0 [&_tr:last-child_th]:shadow-[inset_0_-1px_0_var(--border)]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-0">
                {/*
                  The chevron sits *after* the checkbox, not before it: the
                  body's checkboxes start at this column's left edge, so
                  anything ahead of the header checkbox would push it out of
                  line with the column of ticks underneath.
                */}
                <div className="flex items-center gap-1">
                  <Checkbox
                    aria-label="Select all rows"
                    disabled={pageKeys.length === 0}
                    checked={headerState === "all"}
                    indeterminate={headerState === "some"}
                    onCheckedChange={() =>
                      setSelected((prev) => toggleAll(prev, pageKeys))
                    }
                    className={indeterminateDash}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFilters((prev) => !prev)}
                    aria-expanded={showFilters}
                    aria-controls={filterRowId}
                    aria-label={
                      showFilters ? "Hide column search" : "Show column search"
                    }
                    className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {/*
                      One rotating chevron rather than swapping two icons, so
                      the state change is a movement the eye can follow — the
                      row itself can't animate (see below).
                    */}
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform",
                        !showFilters && "-rotate-90"
                      )}
                    />
                  </button>
                  {/*
                    Collapsing must not hide a filter silently. The header's
                    Search button already carries the dot for that, but it is
                    across the screen from the row that vanished, so the mark
                    is repeated on the control that did the hiding.
                  */}
                  {!showFilters && filtersActive && (
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full bg-primary"
                    />
                  )}
                </div>
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
              The search row: one input per filterable column, filtering the
              table live. It sticks under the header while the body scrolls,
              and the chevron above collapses it — it starts hidden so the
              table leads with data rather than with an empty query form.

              Mounted and unmounted rather than animated open: this is a `tr`
              inside a sticky `thead`, where the usual collapse trick (a
              wrapper transitioning `grid-rows-[0fr]` to `[1fr]`) has nowhere
              to live, and animating the row's own height fights the sticky
              positioning. The chevron carries the motion instead.
            */}
            {showFilters && (
              <TableRow id={filterRowId} className="hover:bg-transparent">
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
            )}
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
              pageRows.map((row, index) => {
                const key = pageKeys[index]
                const checked = selected.has(key)
                // What the menu acts on: the whole selection when this row is
                // part of it, otherwise this row alone — matching what the
                // right-click itself just did to the selection.
                const targets = checked ? [...selected] : [key]
                return (
                  <ContextMenu key={key}>
                    <ContextMenuTrigger
                      render={
                        <TableRow
                          data-state={checked ? "selected" : undefined}
                          onClick={(event) => {
                            if (isSelectionClick(event)) toggleRowSelection(key)
                          }}
                          onContextMenu={() =>
                            setSelected((prev) => selectionForMenu(prev, key))
                          }
                          // The vendored row hovers at `bg-muted/50`, which
                          // barely reads against the card. These rows are
                          // clickable, so the hover is a target indicator
                          // rather than decoration — full `bg-muted` earns it.
                          className="cursor-pointer hover:bg-muted"
                        />
                      }
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
                            column.align === "right" &&
                              "text-right tabular-nums"
                          )}
                        >
                          {column.cell ? column.cell(row) : column.get(row)}
                        </TableCell>
                      ))}
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-60">
                      {/* Base UI requires a group around a group label. */}
                      <ContextMenuGroup>
                        <ContextMenuLabel className="text-muted-foreground">
                          {targets.length > 1
                            ? `${targets.length} rows selected`
                            : String(columns[0].get(row))}
                        </ContextMenuLabel>
                      </ContextMenuGroup>
                      <ContextMenuItem onClick={() => copyRows(targets)}>
                        <ClipboardCopy strokeWidth={1.5} />
                        <span>{rowWord("Copy", targets.length)}</span>
                        <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => toggleRowSelection(key)}>
                        <SquareCheck strokeWidth={1.5} />
                        <span>{checked ? "Deselect row" : "Select row"}</span>
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      {/*
                        The same actions the bulk bar offers, so a row's menu
                        and the bar can't drift apart. Stubs, as there.
                      */}
                      {bulkActions.map(({ label, icon: Icon }) => (
                        <ContextMenuItem key={label}>
                          <Icon strokeWidth={1.5} />
                          <span>{rowWord(label, targets.length)}</span>
                        </ContextMenuItem>
                      ))}
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          <Ellipsis strokeWidth={1.5} />
                          <span>More actions</span>
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-52">
                          {bulkMenuActions.map(({ label, icon: Icon }) => (
                            <ContextMenuItem key={label}>
                              <Icon strokeWidth={1.5} />
                              <span>{label}</span>
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuSeparator />
                      {/*
                        The right-click already made the selection match what
                        the menu acts on (`selectionForMenu`), so this opens the
                        very same confirmation the bulk bar does.
                      */}
                      <ContextMenuItem
                        variant="destructive"
                        onClick={() => setConfirmingDelete(true)}
                      >
                        <Trash2 strokeWidth={1.5} />
                        <span>{rowWord("Delete", targets.length)}</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/*
        Pager — always rendered, even for a single page. The count on the left
        is worth reading on its own ("of 137" is how you learn what a filter
        did), and a footer that came and went with the page count would make
        the table jump every time a search crossed the threshold.
      */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            {pagination.total === 0
              ? "No rows"
              : `${pagination.from}–${pagination.to} of ${pagination.total}`}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <label htmlFor={pageSizeId} className="shrink-0">
            Rows per page
          </label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              const next = Number(value)
              // Follow the row the reader is looking at into the new size
              // rather than dropping them back at page 1.
              setPage((prev) => rescalePage(prev, pageSize, next))
              setPageSize(next)
            }}
          >
            <SelectTrigger id={pageSizeId} size="sm" className="w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/*
          `Pagination` gives the nav/list semantics, but its `PaginationLink`
          renders an anchor for href-based paging — and an anchor with no href
          is not reachable by keyboard. These pages are client state, so the
          controls are real buttons inside that same shell.
        */}
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Go to previous page"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
                className="pl-2"
              >
                <ChevronLeft />
                <span className="hidden sm:block">Previous</span>
              </Button>
            </PaginationItem>
            {pageWindow(pagination.page, pagination.pageCount).map(
              (slot, index) =>
                slot === "gap" ? (
                  // Indexed key: the two gaps are interchangeable and carry no
                  // identity of their own, and their position is the only
                  // thing that distinguishes them.
                  <PaginationItem key={`gap-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={slot}>
                    <Button
                      type="button"
                      variant={slot === pagination.page ? "outline" : "ghost"}
                      size="icon-sm"
                      aria-label={`Go to page ${slot}`}
                      aria-current={
                        slot === pagination.page ? "page" : undefined
                      }
                      onClick={() => setPage(slot)}
                      className="tabular-nums"
                    >
                      {slot}
                    </Button>
                  </PaginationItem>
                )
            )}
            <PaginationItem>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Go to next page"
                disabled={pagination.page >= pagination.pageCount}
                onClick={() => setPage(pagination.page + 1)}
                className="pr-2"
              >
                <span className="hidden sm:block">Next</span>
                <ChevronRight />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
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
          className="absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 animate-in items-center gap-1 rounded-xl border bg-popover p-1 pl-3 shadow-lg fade-in-0 slide-in-from-bottom-2"
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
            onClick={() => setConfirmingDelete(true)}
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

      {/*
        Delete confirmation — the only irreversible action here, so it names
        the rows instead of asking "are you sure?" about an abstract count.
        Both the bulk bar and a row's context menu open this same dialog.
      */}
      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{rowWord("Delete", plan.count)}?</DialogTitle>
            <DialogDescription>
              {plan.count > 1 ? "These rows" : "This row"} will be removed from{" "}
              {label}. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>

          {/*
            The summary: one plain row per item, separated by rules — the name
            on the left, enough columns on the right to tell near-identical
            names apart. Long selections scroll rather than push the buttons
            off screen.
          */}
          <div className="max-h-56 divide-y overflow-y-auto rounded-lg border">
            {plan.preview.map((row) => (
              <div
                key={row.key}
                className="flex items-baseline justify-between gap-4 px-3 py-2"
              >
                <span className="truncate font-medium">{row.primary}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {row.details.map((detail) => detail.value).join(" · ")}
                </span>
              </div>
            ))}
            {plan.more > 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                and {plan.more} more…
              </p>
            )}
          </div>

          {/*
            Selection outlives filtering, so the dialog can be about rows that
            aren't on screen. Say so — otherwise the count looks like a bug.
          */}
          {plan.hidden > 0 && (
            <p className="text-xs text-muted-foreground">
              {plan.hidden === 1
                ? "1 of these rows is"
                : `${plan.hidden} of these rows are`}{" "}
              hidden by the current filters.
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              <Trash2 />
              {rowWord("Delete", plan.count)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
