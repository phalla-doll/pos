"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Check,
  ClipboardCopy,
  Ellipsis,
  Eye,
  Filter,
  PencilLine,
  Plus,
  Search,
  SquareCheck,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ToolbarGroup } from "@/components/dashboard/toolbar-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/hooks/use-workspace"
import type { ScreenProps } from "@/lib/screens"
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
import { conditionGroups } from "@/lib/list-filter-grid"
import { deleteParam } from "@/lib/record-param"
import { primaryRowActions, secondaryRowActions } from "@/lib/row-actions"
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
 * registry entry, which is also what names the tab.
 */
export type ListScreenConfig<T> = {
  /** Column definitions — drive both the filter row and the table. */
  columns: ListColumn<T>[]
  /** The rows to display. */
  rows: T[]
  /**
   * Stable row identity, used for React keys, selection, and the `param` of a
   * record tab. Defaults to the array index — supply a real key if rows can be
   * filtered or sorted, or a selection will follow positions rather than rows.
   */
  rowKey?: (row: T, index: number) => RowKey
  /**
   * Show a "New" button that opens a blank record form in its own tab. Omit
   * for a read-only screen. Submit is a UI-only stub until a backend exists.
   */
  creatable?: boolean
  /** Offer an "Edit" action per row, opening that record in its own tab. */
  editable?: boolean
  /** Singular name for one row — "item", "customer". Used by the record form. */
  noun?: string
  /**
   * What a new record's tab and heading are called. Defaults to `New {label}`,
   * which suits a screen whose label reads as a singular subject ("New
   * Inventory") but not one whose label is a plural ("New Customers" claims to
   * be creating several). Such a screen declares the phrase it wants —
   * `"New customer"` — and the rest keep the default rather than restating a
   * label they are already happy with.
   */
  draftLabel?: string
}

export type ListScreenProps<T> = ListScreenConfig<T> &
  ScreenProps & {
    /**
     * Screen title. Not drawn above the table — the tab chip names the screen
     * — but it is the page's `sr-only` heading and the noun the delete
     * confirmation removes rows from.
     */
    label: string
  }

/**
 * Call-site styling for the header checkbox's indeterminate state: hide the
 * tick and draw a dash instead. The checkbox itself is vendored, so the partial
 * look is composed here rather than by editing `components/ui/checkbox.tsx`.
 */
const indeterminateDash =
  "data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground data-indeterminate:[&_svg]:hidden before:absolute before:hidden before:h-0.5 before:w-2 before:rounded-full before:bg-current data-indeterminate:before:block"

/**
 * The header's surface, and the surface a sortable cell takes under the
 * pointer. A pair, because the second only means anything relative to the
 * first: the hover has to clear the band, and the band is not the `bg-muted`
 * the hover used to be.
 *
 * Both are the chrome's shades — `--table-header` is the band, a step off the
 * card in whichever direction the theme goes, and the hover is that surface's
 * own press. The two shades, the step between them, and the reason a header is
 * chrome at all are stated once in `app/globals.css`; these are the utilities
 * that spend them.
 *
 * Not `bg-muted`, and the body is why: rows alternate on `bg-muted/30`, so a
 * header at `bg-muted` is the same grey the eye is already watching the rows
 * flicker between — a stripe with emphasis rather than a different kind of row.
 *
 * And *not* `color-mix()`, which is how this was first written — mix `--muted`
 * with `--foreground` and both themes come out faintly red. Mixing `in oklch`
 * interpolates a hue channel, the two ends of that mix are near-neutral, and
 * the result lands on `oklch(0.933 0.005 none)`: a missing hue, which renders
 * as hue 0. That is the red axis, so what should have been a near-neutral grey
 * arrives with 0.005 of pink in it. Near-neutrals do not survive a polar mix; a
 * token with a hue already in it does.
 */
const headerSurface = "[&_th]:bg-table-header"
const headerSortHover = "hover:bg-table-header-accent"

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
  columns,
  rows,
  rowKey,
  creatable,
  editable,
  screenType,
}: ListScreenProps<T>) {
  // Creating and editing open as tabs of their own, so this screen needs the
  // workspace to launch them. Null outside a workspace, in which case those
  // affordances simply aren't offered — see `useWorkspace`.
  const workspace = useWorkspace()

  // `filters` is what the table is filtered by right now, applied on every
  // keystroke of the per-column row.
  const [filters, setFilters] = React.useState<FilterState>({})
  const [sort, setSort] = React.useState<SortState | null>(null)
  const [selected, setSelected] = React.useState<SelectionState>(emptySelection)

  // Delete is the one action that can't be undone by clicking again, so it
  // goes through a confirmation that spells out exactly which rows it means.
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)

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

  // Which column asked for the row, so its input can take focus when the row
  // mounts. Null when the header's Search button opened it — that one is about
  // the row as a whole and has no column to land on. Read by `autoFocus`, which
  // fires on mount, and the row *is* mounted and unmounted, so no effect has to
  // chase the field after the fact.
  const [focusColumn, setFocusColumn] = React.useState<string | null>(null)

  // The advanced card edits a *draft* of the same filters and only commits it
  // on Apply, so a half-built query never disturbs the table underneath. It is
  // seeded from the live filters each time the card opens, which is what makes
  // the two surfaces one filter set rather than two.
  //
  // The card is its own collapsible now, so this is the accordion's open state
  // as well as the draft's cue — no `useId` beside it, because the trigger and
  // the panel are one component and Base UI wires `aria-controls` itself.
  //
  // Open on arrival. A shut accordion is a header and a chevron, which says a
  // surface exists but not what it offers; showing the conditions once is what
  // teaches the screen it can be queried this way. Seeding is free at mount —
  // `filters` starts empty, so the draft below already matches it.
  const [advancedOpen, setAdvancedOpen] = React.useState(true)
  const [draft, setDraft] = React.useState<FilterState>({})

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

  // Every column searches for a substring: the row is the whole filter surface
  // now, so there is no operator to carry over from anywhere else.
  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: { op: "contains", value } }))
  }

  // A header's funnel opens the same row the Search button does — one search
  // row, reachable from either place. What the funnel adds is where you land:
  // the row comes up with that column's field already focused, so a filter is
  // one click and typing rather than a click, a hunt, and a click.
  function toggleColumnFilter(key: string) {
    setFocusColumn(key)
    setShowFilters((prev) => !prev)
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

  /**
   * Open one record in its own tab.
   *
   * The two paths differ only in the ref they ask for, and that difference is
   * the whole "as many as we want" rule: `openDraft` mints a param nothing can
   * match, so every New is another tab, while an edit passes the row's key, so
   * a record already open is focused rather than opened a second time — two
   * tabs disagreeing about one record is not a thing this should be able to
   * produce.
   */
  function openRecord(key: RowKey) {
    workspace?.openTab({ screenType, param: String(key) })
  }

  const filtersActive = hasActiveFilter(filters)
  const draftActive = hasActiveFilter(draft)
  // Both affordances need a workspace to open a tab into; without one there is
  // nowhere for the form to go, so neither is rendered.
  const canCreate = Boolean(creatable) && workspace !== null
  const canEdit = Boolean(editable) && workspace !== null

  /**
   * Ask to delete some rows — one row opens the record's delete tab, several
   * fall back to the confirmation dialog.
   *
   * The split is not two minds about the same action; it is the only place the
   * two surfaces can differ. A delete tab is the record's own fields, readonly,
   * which is a far better thing to review than a dialog line — but a form shows
   * *one* record, and a selection of nine has nine. Opening nine tabs would
   * answer a bulk gesture with a pile of work, so the many-row case keeps the
   * dialog, which is built for exactly that: it lists the rows, and it says how
   * many are hidden by the current filters.
   *
   * `canEdit` gates the tab path because `editable` is what says this screen's
   * rows can be addressed one at a time at all — the registry accepts a
   * `delete-` param on the same condition. A screen without it degrades to the
   * dialog rather than to nothing.
   */
  function requestDelete(keys: RowKey[]) {
    const [only] = keys
    if (keys.length === 1 && only !== undefined && canEdit) {
      workspace?.openTab({ screenType, param: deleteParam(String(only)) })
      return
    }
    setConfirmingDelete(true)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-6">
      {/*
        No title block: the tab chip above already names the screen, and a
        heading repeating it cost a third of the screen's height before the
        first row. The toolbar takes its place and leads from the left, where
        a row of controls reads from.

        The heading survives as `sr-only` — it is what gives the screen a
        level-1 landmark, and dropping it outright would leave a page whose
        name only exists as a tab label.
      */}
      {/*
        `gap-3` between the action group and whatever lands beside it: the
        actions are stitched edge to edge inside the group, so a gap at all is
        what says the next thing along is a different kind of thing rather than
        one more action.
      */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="sr-only">{label}</h1>
        {/*
          No selection count and no Clear beside it: the count moved the whole
          toolbar sideways the moment a row was ticked, and the ticks that
          created a selection are the obvious way back out of one — the header
          checkbox clears the page in a click. What the selection is still gets
          said where it matters: the More menu heads itself with it, and the
          delete confirmation names the rows one by one.
        */}
        {/*
          One `ButtonGroup` rather than four buttons spaced apart: everything
          in it acts on rows — makes one, opens one, removes them, or opens the
          menu of the rest — so one segmented control holding them says they
          are one kind of thing. Nothing that changes what the table *shows* is
          in here: that is the advanced card's, below.

          Stock `secondary` at the default size, and nothing else — the group
          is what shapes them, dropping the inner corners and the doubled edges
          and rounding the run's two ends to a pill on its own. See
          `ToolbarGroup`, which the record form's toolbar leads with too.
        */}
        <ToolbarGroup>
          {/*
            Opens a blank form in a new tab rather than unfolding one above the
            table. It is no longer a toggle, so it doesn't need a held-down
            look: each click is another draft, and the tab bar is what shows
            how many are on the go.
          */}
          {canCreate && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => workspace?.openDraft(screenType)}
            >
              <Plus />
              Create
            </Button>
          )}
          {/*
            The toolbar half of a gesture the table already had: double-click a
            row, or right-click it and pick Edit. This is the discoverable one,
            and it exists so a row reached by keyboard can be opened without
            knowing either.

            Called "View" rather than "Edit" because opening the record is all
            this promises — what the tab it lands on offers is that form's to
            say, and on a read-only record "Edit" would have promised something
            the form never gives. The row's own context menu still says "Edit
            row": there the gesture is aimed at one row and the intent is
            unambiguous.

            Enabled only at exactly one selected row. Opening several would
            have to make a tab per row or silently pick one, and neither is
            what the click asked for — the same reason the context menu hides
            it for a multi-row selection.
          */}
          {canEdit && (
            <Button
              type="button"
              variant="secondary"
              disabled={selectedCount !== 1}
              onClick={() => {
                const [key] = [...selected]
                if (key !== undefined) openRecord(key)
              }}
            >
              <Eye />
              View
            </Button>
          )}
          {/*
            Delete never deletes on click — it opens the question, and which
            surface asks it depends on how many rows are ticked. See
            `requestDelete`. Either way the click lands somewhere that names
            what it is about to remove, which is what makes a destructive
            action safe to put in a toolbar at all.

            And that is why it is not red. The colour is the app's mark for a
            click that can't be taken back, and this click only asks a
            question. The answer is where the red belongs, and that is where it
            is: the delete tab's Process, and the dialog's own Delete. A
            warning worn by a button that merely opens the warning is one the
            eye learns to read past.
          */}
          <Button
            type="button"
            variant="secondary"
            disabled={selectedCount === 0}
            onClick={() => requestDelete([...selected])}
          >
            <Trash2 />
            Delete
          </Button>
          {/*
            Every bulk action behind one menu rather than a row of buttons:
            this toolbar already carries Create, View, Delete and Search, and
            spelling the rest out inline wrapped it onto a second line at
            laptop widths. Disabled rather than hidden when nothing is ticked,
            so the actions are discoverable before a selection exists.

            Last in the group, where an overflow menu belongs: the named
            actions come first and the leftovers trail them. "More" with an
            ellipsis says that on its own, so the chevron a named trigger
            needed is dropped — an ellipsis beside a caret is the same
            promise twice.
          */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="secondary"
                  disabled={selectedCount === 0}
                />
              }
            >
              <Ellipsis />
              More
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* Base UI requires a group around a group label. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-muted-foreground">
                  {selectedCount > 1
                    ? `${selectedCount} rows selected`
                    : "1 row selected"}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              {primaryRowActions.map(({ label: action, icon: Icon }) => (
                <DropdownMenuItem key={action}>
                  <Icon strokeWidth={1.5} />
                  {rowWord(action, selectedCount)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {secondaryRowActions.map(
                ({ label: action, icon: Icon, shortcut }) => (
                  <DropdownMenuItem key={action}>
                    <Icon strokeWidth={1.5} />
                    {action}
                    {shortcut && (
                      <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </ToolbarGroup>
      </div>

      {/*
        The advanced card — the same conditions the old popover held, now a
        panel of its own above the table: at this width the fields can breathe
        two abreast, and a surface you keep referring back to while reading
        results has no business being a popover that shuts on the first click
        outside it.

        And it opens itself. It used to be summoned by a Search button up in
        the toolbar, which meant a shut card was invisible — the one surface
        that says what the table is filtered by left no trace when it was the
        table you were looking at. As a collapsible it keeps its header on
        screen always, so the card is its own affordance: the title names it,
        the chevron says it opens, and the dot beside them reports a live
        filter whether the conditions are showing or not. That is the whole
        job the toolbar button had, done by the thing it pointed at.

        The panel is mounted and unmounted with the open (Base UI's default),
        so `autoFocus` and the draft seeding still key off it.
      */}
      <Collapsible
        open={advancedOpen}
        onOpenChange={openAdvanced}
        className="rounded-xl border bg-card"
      >
        {/*
          The header row sits outside the panel, so it survives the collapse —
          it is the card when the card is shut.

          `items-center` now that the header is a single line: the title and
          Clear are two things on one row, and centring is what puts them on
          it. It read `items-start` while a description sat under the title,
          where Clear had to be pinned to the line it belongs beside rather
          than centred against the whole two-line block.

          Open, `pt-4` matches the `px-4` beside it, so the card's top inset is
          the same 16px as its sides rather than the 12px it used to be — the
          one corner where the padding didn't square up. `pb-3` under it is the
          top half of the gap to the fields; the grid's `pt-1` is the rest. See
          there for why the pair adds to 16.

          Shut, it drops to `py-3`. Those numbers are a card's inset, and shut
          this is not a card — it is a bar, one line of text between the
          toolbar and the table, and 16px of air above and below a single line
          made it read as an empty card rather than a closed one. 12 is enough
          to keep the line off the border and no more. It stays even top and
          bottom, because with nothing under it there is no gap for the lower
          half to be part of.

          `min-h-6` holds the row at Clear's height whether Clear is there or
          not. Without it the row is the title's 20px line box until the first
          keystroke fills a condition, at which point Clear appears at 24 and
          shoves every field down 4px — a card that flinches as you start
          typing into it. The two-line header this replaced was taller than the
          button and so never had the problem.
        */}
        <div
          className={cn(
            "flex min-h-6 flex-row items-center justify-between gap-4 px-4",
            advancedOpen ? "pt-4 pb-3" : "py-3"
          )}
        >
          {/*
            The trigger is the title and its chevron, not the whole row: Clear
            shares the row and a button inside a button is not a thing HTML
            has. What it does cover is the pair that reads as "this opens" —
            click either and you get the same panel.

            `text-left` because a button centres its text by default, and this
            one is a heading that happens to be pressable.
          */}
          <CollapsibleTrigger className="group/adv flex min-w-0 items-center gap-2 text-left text-sm font-semibold">
            {/*
              Rotates rather than swapping glyphs, which is what makes the two
              states one control moving between them. Same 90° turn and same
              200ms the sidebar's groups use — a chevron means the same thing
              in both places, so it had better move the same way.
            */}
            <ChevronRight
              aria-hidden
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                advancedOpen && "rotate-90"
              )}
            />
            {/* Named for what it is rather than for what it does: "Search"
                alone was the word on the toolbar button that used to open it,
                which said nothing about this being the deeper of the two
                filter surfaces.

                It stands alone. A description under it once said the
                conditions combine rather than replacing each other, which the
                card does not show on its own — but it said it on every open,
                forever, about a card whose four labelled rows and single
                Apply are not hard to read. A permanent sentence explaining a
                surface is a cost the surface pays every time. */}
            <span className="truncate">Advanced search</span>
            {/*
              Inline rather than a corner badge: the dot marks a filter in
              force, and reading in the flow of the label is what makes it a
              caption on the title instead of decoration floating beside it.

              It matters most when the card is shut — that is when the
              conditions themselves are off screen and this is all that is left
              to say the table is not showing everything.
            */}
            {filtersActive && (
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            )}
          </CollapsibleTrigger>
          {/* Only while the panel is open: it clears the draft, and a button
              for editing conditions you can't see is a button with nothing to
              act on. */}
          {advancedOpen && draftActive && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              // No vertical nudge: the row centres the two now, and the
              // button is taller than the title's line box, so it is what
              // sets the row's height rather than needing to be aligned
              // into it.
              className="shrink-0"
              onClick={() => setDraft({})}
            >
              Clear
            </Button>
          )}
        </div>
        <CollapsibleContent>
          <form onSubmit={applyAdvanced} className="flex flex-col">
            {/*
              The outer grid: one track per column of conditions, laid down
              whether or not there is anything to put in it. One, two at `lg`,
              three at `xl`.

              Three only from `xl`, not from `lg`. The value input is what gives
              way when the card divides — the operator button beside it is a
              fixed 5rem — so at 1024px minus the sidebar a third track leaves
              each input around 6rem, narrower than most of what gets typed into
              it. 1280px is where three of them still read as fields.

              The tracks are unconditional, and the conditions are grouped to
              suit them rather than the other way round: `conditionGroups` fills
              a column before starting the next, so seven conditions are 4/3 and
              the third track at `xl` is simply empty. Letting the grid place
              them would spread the same seven as 3/2/2 — every column a stub,
              and each row of the card three unrelated fields read across. An
              empty track is the better shape of the two, and it is the one this
              was asked for. See `lib/list-filter-grid.ts`.

              `items-start`, so a short last column tops out with the others
              rather than being stretched down to the tallest one's height.

              `gap-x-8` between tracks against the inner grid's `gap-x-4`
              between a label and its field: the gap the eye crosses to reach
              the next column has to be plainly wider than the one inside a
              condition, or the two read as one long row.

              `pt-1` on top of the header's `pb-3` puts 16px between the title
              and the first field, against `gap-y-2`'s 8px between the fields
              themselves. The ratio is the point: a heading has to sit further
              from its group than the group's items sit from each other, and the
              old 12-against-10 said the title was simply another row.

              `pb-3` under the last field rather than the 16 above the first,
              because what the block ends at is not the card's edge but the
              footer's rule — and a rule wants equal air on both sides. At 16
              it had 16 above and the footer's 12 below, which is a 29px void
              with a hairline in it, in a card whose rows are 8px apart. That
              gap was what made the footer read as slack, not the footer's own
              padding, which is already tighter than this card's 16px inset.

              Whole 4px steps throughout — the half-steps this used to hold
              (`pt-0.5`, `gap-y-2.5`, and the header's `pb-2.5`) were the only
              ones on the screen.

              `scrollbar-subtle` for the same reason the table box wears it:
              once there are enough filterable columns to scroll, a default
              scrollbar is both louder than the one 16px below it and wide
              enough to eat into the fields.
            */}
            <div className="grid scrollbar-subtle max-h-[min(26rem,50vh)] grid-cols-1 items-start gap-x-8 gap-y-2 overflow-y-auto px-4 pt-1 pb-3 lg:grid-cols-2 xl:grid-cols-3">
              {/*
                A column of conditions, and its own two-track grid: the label
                column is shared down the column, so every field in it starts at
                the same x no matter how long its header is.

                `fit-content(8rem)` sizes that track to the longest label
                instead of a fixed width. A fixed one sets the gap to `width -
                label + gap`, so it grew as labels got shorter and "SKU" sat
                nearly twice as far from its field as "Category" did. Sizing to
                content makes the *widest* label define the track, so the
                tightest row is exactly `gap-x` and no row is arbitrarily loose.
                The 8rem cap keeps one long header from eating the input's
                width; `truncate` handles the rest.

                Per column rather than one label track shared across the card,
                which is also what killed the `pl-2` this used to need: with the
                pairs laid out by one grid, a label sat the same `gap-x` from
                the field it named and from the field before it, so the second
                of a pair had to be padded away from its neighbour. Separate
                grids put a real gap between columns, and the label track sizes
                to its own column's longest header rather than the card's.

                `minmax(0,1fr)` lets the input track actually shrink — a bare
                `1fr` floors at the input's intrinsic width and would push the
                card wider.
              */}
              {conditionGroups(filterable).map((group) => (
                <div
                  // The first condition names the column: groups are rebuilt
                  // whenever the filterable set changes, and a positional key
                  // would let React reuse a column's DOM under a new set of
                  // fields.
                  key={group[0].key}
                  className="grid grid-cols-[fit-content(8rem)_minmax(0,1fr)] items-center gap-x-4 gap-y-2"
                >
                  {group.map((column) => {
                    const operators = operatorsByKind[columnKind(column, rows)]
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

                          `font-normal`, stated rather than left to inherit:
                          the label and the value it names carry the same
                          weight, so the pair reads as one thing. Bolding the
                          label turns the label track into a column of headers
                          the eye stops at on the way to every field.

                          No padding to hold it off the column beside it: the
                          columns are separate grids now, so the outer
                          `gap-x-8` is a real gap rather than one more track
                          boundary the label sat in the middle of.
                        */}
                        <label
                          htmlFor={`adv-${column.key}`}
                          className="truncate text-sm font-normal"
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
                                    // A fixed width so every field's divider lands
                                    // in the same place — "=" and "contains" must
                                    // not stagger the inputs.
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
                                      setDraftOperator(column.key, operator.op)
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
                          />
                        </InputGroup>
                      </React.Fragment>
                    )
                  })}
                </div>
              ))}
            </div>
            {/*
              Apply leads the footer, under the first condition rather than
              across the card from it: the fields start at the left, so that is
              where the eye is when the last one is filled. Reset all keeps the
              far end — the two are opposites, and putting them side by side
              invites the wrong one.
            */}
            <div className="flex items-center gap-2 border-t px-4 py-3">
              {/*
                `sm` and `outline`, matching the row of actions above it, so
                every control on this screen stands the same height and carries
                the same weight — the card's own border already sets Apply
                apart, so a solid fill would only shout across it.
              */}
              <Button type="submit" variant="outline" size="sm">
                <Search />
                Apply
              </Button>
              {filtersActive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={clearFilters}
                >
                  Reset all
                </Button>
              )}
            </div>
          </form>
        </CollapsibleContent>
      </Collapsible>

      {/* Results table — the first row is a fixed, live per-column search bar. */}
      {/*
        Body rows sit two steps below the table's `text-sm`, at 12px: the
        header, filter row, and controls keep 14px, so shrinking only the data
        lets a wide table fit more per screen without the chrome shrinking with
        it.

        Spelled `text-[0.75rem]` rather than `text-xs`, which is the same 12px
        with a `line-height: 1rem` attached. The leading is left to inherit on
        purpose: Tailwind's `text-sm` on the table sets a *unitless* ratio, so
        a cell scales its own line box off its own size and the rows keep the
        table's proportion instead of being pinned to a height picked for 14px
        text.

        Smaller text is not licence to squeeze the box around it, though.
        `py-2` keeps an equal 8px above and below that line box, which is what
        stops a column of values reading as one block of text with rules
        through it — so the row came down with the text and no further,
        landing a couple of pixels under the header's 36px rather than
        tightening around it.

        `px-3` widens the gutters to 24px between neighbouring columns, and it
        is set on `th` and `td` alike: the two share this padding, so a change
        to one alone would knock the labels out of line with the values under
        them.
      */}
      {/*
        This box wears the *header's* colour, not the card's, and `TableBody`
        below paints the card back over the rows. That looks inside out until
        you find the 6px down the right-hand side that neither the header nor
        the rows can reach: `scrollbar-subtle` sets an explicit
        `::-webkit-scrollbar` width, which makes the scrollbar take layout space
        and leaves its track transparent, so the strip beside the table shows
        whatever this element's background is. On `bg-card` that put a notch of
        card colour at the end of the header band — invisible beside the white
        rows, obvious beside a tinted header.

        A table can't help: the strip is outside the table's box, so no cell,
        row, or column can extend into it. What *can* cover it is this element,
        which is why the two colours swap places. The strip is then the band's
        colour for the table's full height, which beside the header is the band
        and beside the rows is a tinted scrollbar track — a track is a
        reasonable thing for a strip under a scrollbar to look like, where a
        notch in the header is not.

        A row group paints under its rows and cells, so `bg-card` on the body
        changes nothing about the rows themselves: the zebra `even:bg-muted/30`,
        the hover, and the selected fill all still composite over card exactly
        as they did.
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
      {/*
        The checkbox column is padded on both sides. The vendored table zeroes
        the right padding of any cell holding a checkbox, so the column read as
        4px of gutter left of the tick and only the next cell's padding to its
        right — the tick sat nearer its label than the table edge. `pl-4` and
        `pr-1` put the same 16px on both sides of it: 4px here plus the next
        cell's 12px of `px-3`.

        So this one number follows the gutter rather than standing on its own —
        widening the columns without it would leave the tick pinned to the edge
        it was moved off.

        It has to be spelled as the same kind of descendant override as the
        `pl-4` beside it: the vendored rule is `:has([role=checkbox])`, which
        outranks a bare utility on the cell itself.
      */}
      {/*
        Sized to its rows, not to the space available: no `flex-1`, so a short
        table is a short card and the pager beneath it rides up with the last
        row instead of being pinned to the bottom of the screen with a field of
        empty card between them.

        It still can't outgrow the screen. Flex items shrink by default, and
        this column is height-bounded, so a long table hits the ceiling and
        `min-h-0` + `overflow-auto` hand it back its own scrollbar — which is
        also what the sticky header measures itself against.
      */}
      {/*
        `rounded-xl`, the radius every other panel in the app takes — the
        advanced card above it and the record form's card alike. At `rounded-md`
        this was the odd one out, and it showed most where it mattered: the two
        panels sit 16px apart in the same column, so a 6px corner under a 12px
        one read as two boxes from different sets rather than one surface split
        in two. `overflow-auto` clips the header band to the corners, so the
        square-cornered cells inside need nothing of their own.
      */}
      <div className="scrollbar-subtle min-h-0 overflow-auto rounded-xl border bg-table-header [&_[data-slot=table-container]]:overflow-visible [&_td]:px-3 [&_td]:py-2 [&_td]:text-[0.75rem] [&_td:first-child]:pr-1 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-3 [&_th:first-child]:pr-1 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
        {/*
          The separated border model, against Tailwind's `border-collapse:
          collapse` default. A collapsed table paints in two passes — every
          background first, then every foreground — and a sticky section is not
          given a layer of its own, so the body's *text* drew over the header's
          cell backgrounds however they were coloured: rows sliding under the
          header showed through the band between the labels and the search
          inputs. Separating the borders is what earns the header its own paint
          order.

          The cost is that row borders are ignored in this model, so the
          separators move to the cells. `TableRow`'s `border-b` and
          `TableBody`'s last-row exemption are both vendored, and both are now
          inert — these two rules restate them one level down rather than
          editing `table.tsx`.
        */}
        <Table className="border-separate border-spacing-0 [&_tbody_td]:border-b [&_tbody_tr:last-child_td]:border-b-0">
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
          {/*
            The background is on the cells, not on this `thead`. A sticky row
            group is lifted out of the table's painting order, but its own
            background isn't lifted with it — so the rows scrolling underneath
            showed through wherever a header cell left space, most visibly in
            the padding between the label row and the search row.

            Cell backgrounds *are* painted with the sticky group, so `[&_th]`
            covers the whole header — see `headerSurface` for what it paints.
            It stays out of the way of the sort hover: a `[&_th]` rule scores
            (0,1,1) against an element's own `hover:` at (0,2,0), so the hover
            still wins.

            The rules between and beneath the header rows are drawn on the
            cells for the same reason the body's are — see the `Table` above.
            The bottom one stays an inset shadow rather than a border: it is
            the edge the scrolling body meets, and a shadow can't be mistaken
            for part of the table's border geometry.
          */}
          {/*
            `h-9` — 36px, the same height as the search row below and a hair
            over a body row. The header carries its weight in its own surface,
            the label's colour, and the rule under it rather than in extra
            height, so there is nothing for a taller row to say; what it must
            not be is *tighter* than a data row, which the old 32px was the
            moment the rows opened up.
          */}
          <TableHeader
            className={cn(
              "sticky top-0 z-10 [&_th]:h-9 [&_tr:last-child_th]:shadow-[inset_0_-1px_0_var(--border)] [&_tr:not(:last-child)_th]:border-b",
              headerSurface
            )}
          >
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-0">
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
              </TableHead>
              {columns.map((column) => {
                const active = sort?.key === column.key
                const sortable = column.sortable !== false
                const canFilter = column.filterable !== false
                const columnFiltered = Boolean(filters[column.key]?.value)
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
                    // The whole cell is the sort target, so the whole cell is
                    // what lights up — a hover that stopped at the label made
                    // the header look like a button sitting in dead space,
                    // when the dead space was clickable too.
                    //
                    // The handler lives here rather than on the button, and
                    // the button deliberately has none: a click on the label
                    // bubbles up to exactly one handler, and so does the click
                    // event the button synthesises for Enter/Space, so the
                    // keyboard path keeps working without sorting twice.
                    onClick={
                      sortable ? () => toggleSort(column.key) : undefined
                    }
                    className={cn(
                      // Headers are centred over their column while the data
                      // stays left-aligned: the label names the column rather
                      // than starting its text, and centring is what reads as
                      // a caption on the whole width. `text-center` is enough
                      // for both branches below — the sort button is
                      // inline-flex, so text alignment places it, and its
                      // symmetric `-mx-2.5` doesn't shift that.
                      //
                      // Numeric columns are the exception: their right edge is
                      // where the digits line up, so the header follows them.
                      column.align === "right"
                        ? "text-right tabular-nums"
                        : "text-center",
                      sortable &&
                        "group/sort cursor-pointer transition-colors select-none",
                      sortable && headerSortHover
                    )}
                  >
                    {/*
                      Label, sort icon, funnel — one flex row so the pair
                      centres as a unit and the funnel keeps its place however
                      long the header is.
                    */}
                    <div
                      className={cn(
                        "flex items-center gap-0.5",
                        column.align === "right"
                          ? "justify-end"
                          : "justify-center"
                      )}
                    >
                      {/*
                        A spacer the funnel's width, balancing it on the left so
                        the label centres over the column rather than the
                        label-plus-funnel pair — without it the funnel's width
                        pulls the label left of centre. Only for centred columns;
                        a right-aligned header wants its funnel tight against the
                        label at the edge, not mirrored across it.
                      */}
                      {canFilter && column.align !== "right" && (
                        <span aria-hidden className="size-6 shrink-0" />
                      )}
                      {sortable ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          // Its own hover surface is dropped: the cell behind it
                          // now draws that, and two `bg-muted` layers would stack
                          // into a darker patch the shape of the label.
                          className={cn(
                            // Keyed off the cell's hover, not its own: the label
                            // has to darken when the pointer is anywhere in the
                            // column header, including the padding beside it.
                            "-mx-2.5 h-7 font-medium text-muted-foreground group-hover/sort:text-foreground hover:bg-transparent",
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
                      {canFilter && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Filter ${column.header}`}
                          aria-expanded={showFilters}
                          aria-controls={filterRowId}
                          // The cell around it sorts. This is the one thing
                          // inside it that means something else, so it has to
                          // stop the click travelling — otherwise opening a
                          // column's search also re-sorts the table under it.
                          // Enter/Space arrive as a synthesised click on this
                          // same button, so the keyboard path is covered too.
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleColumnFilter(column.key)
                          }}
                          className={cn(
                            // Quiet until wanted: a funnel per column at full
                            // strength would out-shout the labels it sits
                            // beside. It comes up on hover, while the row is
                            // open, and — the case worth seeing from across
                            // the table — whenever that column is filtering.
                            "text-muted-foreground/50 group-hover/sort:text-muted-foreground hover:bg-transparent hover:text-foreground",
                            showFilters && "text-muted-foreground",
                            columnFiltered &&
                              "text-primary group-hover/sort:text-primary hover:text-primary"
                          )}
                        >
                          <Filter
                            // Filled once the column is actually filtering, so
                            // the state reads as a shape and not only a colour.
                            fill={columnFiltered ? "currentColor" : "none"}
                          />
                        </Button>
                      )}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
            {/*
              The search row: one input per filterable column, filtering the
              table live. It sticks under the header while the body scrolls,
              and either the header's Search button or any column's funnel
              toggles it — the funnel differing only in focusing its own field.
              It starts hidden so the table leads with data rather than with an
              empty query form.

              Mounted and unmounted rather than animated open: this is a `tr`
              inside a sticky `thead`, where the usual collapse trick (a
              wrapper transitioning `grid-rows-[0fr]` to `[1fr]`) has nowhere
              to live, and animating the row's own height fights the sticky
              positioning.
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
                    // `py-1` around the `h-7` input puts this row at the same
                    // 36px as the label row above it — the two read as one
                    // header rather than a header with a taller strip bolted
                    // under it.
                    <TableHead key={column.key} className="py-1">
                      {canFilter ? (
                        <div className="relative">
                          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                          {/*
                            Under the vendored `h-8`/`text-sm`, at the body
                            rows' 12px rather than the header controls' 14:
                            this row sits *in* the table, so it reads at the
                            table's density, not the toolbar's. The `md:` half
                            is not a duplicate — the vendored input goes back
                            up to `text-sm` at that breakpoint, so the size has
                            to be restated to hold.
                          */}
                          <Input
                            aria-label={`Search ${column.header}`}
                            // Only when this column's funnel is what opened
                            // the row — see `focusColumn`.
                            autoFocus={column.key === focusColumn}
                            value={filters[column.key]?.value ?? ""}
                            placeholder={`Search ${column.header.toLowerCase()}…`}
                            onChange={(event) =>
                              setFilter(column.key, event.target.value)
                            }
                            // The field wears the body's surface, `bg-card`,
                            // in both themes. The vendored input is
                            // `bg-transparent` (plus a faint lift in dark),
                            // which was invisible while the header matched the
                            // rows and is a hole in the band now that it
                            // doesn't — a search field has to read as
                            // something you can type into, not as a gap.
                            className={cn(
                              "h-7 rounded-sm bg-card pl-6.5 text-[0.75rem] md:text-[0.75rem] dark:bg-card",
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
          <TableBody className="bg-card">
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
                          // Double-click opens the record. It costs nothing to
                          // add: `isSelectionClick` already refuses the second
                          // click of a double-click, so the two gestures were
                          // never going to fire together.
                          onDoubleClick={
                            canEdit ? () => openRecord(key) : undefined
                          }
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
                      {/*
                        Only for a single row: "Edit" over a multi-row
                        selection would have to either open several forms at
                        once or silently pick one, and neither is what the
                        click asked for. Double-clicking the row does the same
                        thing — this is the discoverable half of that gesture.
                      */}
                      {canEdit && targets.length === 1 && (
                        <ContextMenuItem onClick={() => openRecord(key)}>
                          <PencilLine strokeWidth={1.5} />
                          <span>Edit row</span>
                        </ContextMenuItem>
                      )}
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
                        The same actions the header's Actions menu offers, so
                        the two can't drift apart. Stubs, as there.
                      */}
                      {primaryRowActions.map(({ label, icon: Icon }) => (
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
                          {secondaryRowActions.map(({ label, icon: Icon }) => (
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
                        the menu acts on (`selectionForMenu`), so this and the
                        toolbar's Delete are asking about the same rows and go
                        the same way — one row to its own delete tab, several
                        to the dialog. See `requestDelete`.
                      */}
                      <ContextMenuItem
                        variant="destructive"
                        onClick={() => requestDelete(targets)}
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
          <Separator
            orientation="vertical"
            className="h-4 data-vertical:self-center"
          />
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
        Delete confirmation — now the *multi-row* half of deleting, since a
        single row goes to a delete tab instead (see `requestDelete`). It keeps
        the job the tab can't do: naming several rows at once, and saying how
        many of them the current filters are hiding.

        Still the same rule as before — it names the rows rather than asking
        "are you sure?" about an abstract count.
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
