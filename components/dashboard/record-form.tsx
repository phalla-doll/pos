"use client"

import * as React from "react"
import { BadgeCheck, Eraser, Plus, Save, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useWorkspace } from "@/hooks/use-workspace"
import type { ListColumn } from "@/lib/list-rows"
import type { RowKey } from "@/lib/list-selection"
import { isDraft, recordId } from "@/lib/record-param"

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
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="sr-only">{creating ? draftLabel : `Edit ${noun}`}</h1>
        <ButtonGroup>
          {/*
            Save leads the toolbar, before the way out of the tab: the order is
            what you do here, then what you do to leave. `form` points it at
            the fields below, since the button no longer lives inside them.
          */}
          {!missing && (
            <Button
              type="submit"
              form={formId}
              variant="outline"
              className="pr-3 pl-2.5"
            >
              {creating ? <Plus /> : <Save />}
              {creating ? `Create ${noun}` : "Save changes"}
            </Button>
          )}
          {/*
            A UI-only stub, like the one on the list's toolbar — there is no
            backend to approve against yet, so it carries no handler. Editing
            only: a draft is not a record anyone can have approved, and
            offering it there would promise the click does two things.
          */}
          {!creating && !missing && (
            <Button type="button" variant="outline" className="pr-3 pl-2.5">
              <BadgeCheck />
              Approve
            </Button>
          )}
          {/*
            Only on an edit: a draft has no record to delete, and "Delete" over
            a form that has never been saved would mean nothing but Clear,
            which is already offered beside it.

            This is where deleting one record lives now — the list's toolbar no
            longer carries it, so the deliberate act of opening a record is what
            puts its delete in reach.
          */}
          {!creating && !missing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmingDelete(true)}
              className="pr-3 pl-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 />
              Delete
            </Button>
          )}
          {/*
            Only on a draft. Here "clear" means one unambiguous thing — empty
            every field — whereas on an edit form the same word could mean
            either blanking the record or putting back what it said when the
            tab opened, and a button that has to be guessed at is worse than no
            button. Disabled rather than hidden while the form is untouched, so
            it doesn't appear the moment you start typing.
          */}
          {creating && (
            <Button
              type="button"
              variant="outline"
              disabled={!dirty}
              onClick={clearFields}
              className="pr-3 pl-2.5"
            >
              <Eraser />
              Clear
            </Button>
          )}
        </ButtonGroup>
        {/*
          Close stands apart from the group, the way Search does on the list:
          everything in the group acts on the record — saves it, approves it,
          deletes it — while this one only puts the tab away, and the record is
          untouched either way. A stray click on the end of the group should
          not be able to close the tab.

          Closing is the workspace's job, so the button only exists inside one.
          It never isn't, in practice — but `useWorkspace` is allowed to answer
          null and this is cheaper than asserting it can't.
        */}
        {workspace && (
          <Button
            type="button"
            variant="outline"
            onClick={() => workspace.closeTab(tabId)}
            className="pr-3 pl-2.5"
          >
            <X />
            Close
          </Button>
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
