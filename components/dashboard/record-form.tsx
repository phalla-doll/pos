"use client"

import * as React from "react"
import {
  BadgeCheck,
  Ellipsis,
  Eraser,
  Pause,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useWorkspace } from "@/hooks/use-workspace"
import type { ListColumn } from "@/lib/list-rows"
import type { RowKey } from "@/lib/list-selection"
import { isDraft, recordId } from "@/lib/record-param"
import { primaryRowActions, secondaryRowActions } from "@/lib/row-actions"
import { toolbarBar, toolbarButton } from "@/lib/screen-toolbar"
import { cn } from "@/lib/utils"

export type RecordFormProps<T> = {
  /** The screen this record belongs to — "Inventory", "Customers". */
  label: string
  /** Singular name for one row, used in the title and the submit button. */
  noun: string
  /**
   * The heading for a new record — "New Inventory", "New customer". Resolved
   * by the registry rather than built here, so this phrase and the tab chip
   * showing it are literally the same string.
   */
  draftLabel: string
  /** The same columns the list renders, reused as the form's fields. */
  columns: ListColumn<T>[]
  /** All rows, searched for the one being edited. */
  rows: T[]
  /** Row identity — the other half of the `param` a record tab carries. */
  rowKey: (row: T, index: number) => RowKey
  /** This tab's param: a draft token, or the key of the row to edit. */
  param: string
  /** This tab's id, so the form can close the tab it is rendered in. */
  tabId: string
}

/**
 * One record, open in its own tab — the create form and the edit form, which
 * are the same fields over a different starting point and so are one component
 * rather than two.
 *
 * Which one it is comes entirely from the tab's `param`: a draft token starts
 * blank, a row key seeds from that row. Nothing else distinguishes them, and
 * nothing here decides *when* to be a draft — that is the reuse rule in
 * `openOrReuse`, and this component only reads its consequence.
 *
 * Fields derive from the list's own `columns`, so a column added to a screen
 * shows up here without being restated — the same single-source rule the
 * filter row and the table already follow.
 *
 * Submit is a UI-only stub: there is no backend to save to, so it reports
 * success and leaves the values on screen rather than pretending to persist.
 */
export function RecordForm<T>({
  label,
  noun,
  draftLabel,
  columns,
  rows,
  rowKey,
  param,
  tabId,
}: RecordFormProps<T>) {
  const workspace = useWorkspace()
  const creating = isDraft(param)

  // The row this tab edits, found once by the key the param carries. A record
  // tab can outlive its row (a stale link, a deleted record), so this is
  // allowed to miss and the form says so rather than rendering blank fields
  // that would look like a create form.
  const record = React.useMemo(() => {
    const id = recordId(param)
    if (id === null) return null
    const index = rows.findIndex((row, i) => String(rowKey(row, i)) === id)
    return index === -1 ? null : rows[index]
  }, [param, rows, rowKey])

  // Seeded from the record, not synced to it: once the form is open the user's
  // edits own these values. The tab is keyed by its id, so a different record
  // is always a different mount and there is no stale-seed case to guard.
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    record === null
      ? {}
      : Object.fromEntries(
          columns.map((column) => [column.key, String(column.get(record))])
        )
  )
  const [saved, setSaved] = React.useState(false)

  // Deleting can't be undone by clicking again, so it goes through a
  // confirmation — the same rule the list screen's dialog follows, over one
  // record rather than a selection.
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)

  // The submit button sits in the toolbar above the form rather than inside
  // it, so it reaches the form the way HTML lets a button outside one do:
  // by id. Same button, same submit — only the position moved.
  const formId = React.useId()

  // Whether there is anything to clear. A field the user emptied by hand is
  // still a key in `values`, so this asks what the inputs actually show rather
  // than whether the object has been written to.
  const dirty = Object.values(values).some((value) => value !== "")

  // Back to the blank form the tab opened as — including the "Created" note,
  // which described values that are no longer on screen.
  function clearFields() {
    setValues({})
    setSaved(false)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    // UI-only stub: no persistence yet.
    setSaved(true)
  }

  // UI-only stub, like submit. What it can do honestly is close the tab: a
  // record form left open over a record that is supposed to be gone is the one
  // state this shouldn't leave behind.
  function confirmDelete() {
    setConfirmingDelete(false)
    workspace?.closeTab(tabId)
  }

  const missing = !creating && record === null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-6">
      {/*
        No title block, the same as the list screen it opened from: the tab
        chip already names this record — "SKU-0001", or the draft label — and a
        heading repeating it pushed the fields down for nothing. The toolbar
        takes its place, in the same spot and leading from the same left edge,
        so switching between a list and a record doesn't move the controls.

        The heading survives as `sr-only`, since it is the screen's level-1
        landmark, and it is still built from different halves: creating uses
        the registry's draft label, while editing names the *row* ("Edit item")
        — its chip carries the id, and "Edit Inventory" would claim to be
        editing the screen itself.
      */}
      {/*
        `gap-3` rather than `gap-2`, matching the list's toolbar: the wider gap
        is what earns Close its "different kind of thing" standing beside the
        actions — at `gap-2` the split read as the spacing inside a tray,
        saying nothing.
      */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="sr-only">{creating ? draftLabel : `Edit ${noun}`}</h1>
        {/*
          The same tray the list's toolbar leads with, and the whole of what it
          looks like is `toolbarBar` — so the two rows can't drift apart the
          way they did while each call site spelled its own radius out.
        */}
        <div role="group" className={toolbarBar}>
          {/*
            Save leads the toolbar, before the way out of the tab: the order is
            what you do here, then what you do to leave. `form` points it at
            the fields below, since the button no longer lives inside them.

            One word on an edit, where it used to read "Save changes". The row
            beside it is four more verbs of the same length, and the only one
            that had a noun bolted on was the one whose object is least in
            doubt — you are looking at the record it saves. A draft keeps its
            noun ("Create item") because there the button is also what *names*
            what is about to exist.
          */}
          {!missing && (
            <Button
              type="submit"
              form={formId}
              variant="outline"
              className={toolbarButton}
            >
              {creating ? <Plus /> : <Save />}
              {creating ? `Create ${noun}` : "Save"}
            </Button>
          )}
          {/*
            Verify and Hold: the two things done *to* a record once it exists,
            and the pair the list's toolbar can't offer — it acts over a
            selection, where "hold" would have to mean holding several things
            at once. UI-only stubs, like the rest, so neither carries a
            handler.

            Editing only, both of them. A draft is not a record anyone can have
            verified or put on hold, and offering either there would promise
            the click does two things — save it, then act on it.
          */}
          {!creating && !missing && (
            <Button type="button" variant="outline" className={toolbarButton}>
              <BadgeCheck />
              Verify
            </Button>
          )}
          {!creating && !missing && (
            <Button type="button" variant="outline" className={toolbarButton}>
              <Pause />
              Hold
            </Button>
          )}
          {/*
            On both forms, and meaning the same thing on each: empty every
            field. It was once a draft-only button on the grounds that on an
            edit "clear" could mean either blanking the record or putting back
            what it said when the tab opened — but the fix for a word that
            could mean two things is to pick one, not to withhold the button.
            This is the blanking one. Putting the record back is what closing
            the tab without saving already does, and does more safely.

            Disabled while every field is empty, so it doesn't offer to do
            nothing. On an edit that is only true once you have emptied the
            form by hand.
          */}
          {!missing && (
            <Button
              type="button"
              variant="outline"
              disabled={!dirty}
              onClick={clearFields}
              className={toolbarButton}
            >
              <Eraser />
              Clear
            </Button>
          )}
          {/*
            The leftovers, behind one menu — the same shape the list's toolbar
            ends with, reading from the same `lib/row-actions` list, so the two
            surfaces can't drift apart. Bare labels here: the list says "Export
            3 rows" because it acts on a selection, and this form has exactly
            one record.

            Delete lives in it, last and behind a divider. It used to be a
            button in this row, and this is the demotion the list screen paid
            for: deleting one record is reachable from that toolbar too now, so
            the case for spending a slot on it here is weaker than the case for
            not sitting a destructive click beside Clear. It still opens the
            confirmation rather than deleting — a menu item is easier to reach
            by accident than a button, not harder.

            Editing only, like Verify and Hold: every action in it is about a
            record that exists.
          */}
          {!creating && !missing && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className={toolbarButton}
                  />
                }
              >
                <Ellipsis />
                More
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {primaryRowActions.map(({ label: action, icon: Icon }) => (
                  <DropdownMenuItem key={action}>
                    <Icon strokeWidth={1.5} />
                    {action}
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 strokeWidth={1.5} />
                  Delete {noun}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {/*
          Close stands in a tray of its own, the way Search does on the list:
          everything in the tray beside it acts on the record — saves it,
          verifies it, holds it — while this one only puts the tab away, and
          the record is untouched either way. A stray click on the end of that
          tray should not be able to close the tab.

          `rounded-full` for the same reason Search takes it: alone in a tray,
          a chip has only the pill around it to read against.

          Closing is the workspace's job, so the button only exists inside one.
          It never isn't, in practice — but `useWorkspace` is allowed to answer
          null and this is cheaper than asserting it can't.
        */}
        {workspace && (
          <div className={toolbarBar}>
            <Button
              type="button"
              variant="outline"
              onClick={() => workspace.closeTab(tabId)}
              className={cn(toolbarButton, "rounded-full")}
            >
              <X />
              Close
            </Button>
          </div>
        )}
        {/*
          Beside the button that caused it, now that saving is up here.
        */}
        {saved && (
          <p className="text-sm text-muted-foreground">
            {creating ? "Created" : "Saved"} — not yet persisted.
          </p>
        )}
      </div>

      {missing ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No {noun} with the id <span className="font-medium">{param}</span> in{" "}
          {label}. It may have been deleted since this tab was opened.
        </div>
      ) : (
        <form
          id={formId}
          onSubmit={handleSubmit}
          className="rounded-xl border bg-card p-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {columns.map((column) => (
              <div key={column.key} className="flex flex-col gap-1.5">
                <label
                  htmlFor={`field-${column.key}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  {column.header}
                </label>
                <Input
                  id={`field-${column.key}`}
                  value={values[column.key] ?? ""}
                  placeholder={`Enter ${column.header.toLowerCase()}…`}
                  onChange={(event) => {
                    setValues((prev) => ({
                      ...prev,
                      [column.key]: event.target.value,
                    }))
                    setSaved(false)
                  }}
                />
              </div>
            ))}
          </div>
        </form>
      )}

      {/*
        Names the record rather than asking "are you sure?" about an abstract
        one — the same rule the list's confirmation follows.
      */}
      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {noun}?</DialogTitle>
            <DialogDescription>
              <span className="font-medium">{param}</span> will be removed from{" "}
              {label}. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              <Trash2 />
              Delete {noun}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
