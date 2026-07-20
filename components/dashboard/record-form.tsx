"use client"

import * as React from "react"
import { Eraser, Plus, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScreenHeader } from "@/components/dashboard/screen-header"
import { useWorkspace } from "@/hooks/use-workspace"
import { withArticle } from "@/lib/article"
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

  const missing = !creating && record === null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-6">
      {/*
        The two headings are built from different halves on purpose.

        Creating uses the registry's draft label — "New Inventory", or
        whatever a screen whose label doesn't sit well after "New" declared
        instead. It is also the tab chip and the browser tab title, and those
        are read on their own — in the overflow menu, or in a browser tab strip
        — with no Inventory tab beside them to say which item is meant.

        Editing names the *row*: "Edit item". Its chip already carries the
        record's own id ("SKU-0001"), so this heading is never read alone, and
        "Edit Inventory" would claim to be editing the screen itself.
      */}
      <ScreenHeader
        label={creating ? draftLabel : `Edit ${noun}`}
        description={
          creating
            ? `Add ${withArticle(noun)} to ${label}.`
            : `Editing ${param} in ${label}.`
        }
        actions={
          <div className="flex items-center gap-2">
            {/*
              Only on a draft. Here "clear" means one unambiguous thing —
              empty every field — whereas on an edit form the same word could
              mean either blanking the record or putting back what it said
              when the tab opened, and a button that has to be guessed at is
              worse than no button. Disabled rather than hidden while the form
              is untouched, so it doesn't appear the moment you start typing.
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
            {/*
              Closing is the workspace's job, so the button only exists inside
              one. It never isn't, in practice — but `useWorkspace` is allowed
              to answer null and this is cheaper than asserting it can't.
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
          </div>
        }
      />

      {missing ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No {noun} with the id <span className="font-medium">{param}</span> in{" "}
          {label}. It may have been deleted since this tab was opened.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border bg-card p-4"
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
          <div className="flex items-center justify-end gap-2">
            {saved && (
              <p className="mr-auto text-sm text-muted-foreground">
                {creating ? "Created" : "Saved"} — not yet persisted.
              </p>
            )}
            <Button type="submit" className="pr-3 pl-2.5">
              {creating ? <Plus /> : <Save />}
              {creating ? `Create ${noun}` : "Save changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
