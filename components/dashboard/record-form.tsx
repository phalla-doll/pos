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
import { ToolbarGroup } from "@/components/dashboard/toolbar-group"
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
import { conditionGroups } from "@/lib/list-filter-grid"
import type { ListColumn } from "@/lib/list-rows"
import type { RowKey } from "@/lib/list-selection"
import { deleteParam, paramKind, recordId } from "@/lib/record-param"
import type { ScreenType } from "@/lib/screens"
import { primaryRowActions, secondaryRowActions } from "@/lib/row-actions"
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
  /**
   * This tab's param: a draft token, the key of the row to edit, or that key
   * marked for deletion. Which of the three is `@/lib/record-param`'s to say.
   */
  param: string
  /**
   * The screen this record's tabs belong to, so the form can open another one
   * of its own — the delete tab, which is a sibling ref on the same screen.
   */
  screenType: ScreenType
  /** This tab's id, so the form can close the tab it is rendered in. */
  tabId: string
}

/**
 * One record, open in its own tab — the create form, the edit form, and the
 * delete form, which are the same fields over a different starting point and a
 * different question, and so are one component rather than three.
 *
 * Which one it is comes entirely from the tab's `param`: a draft token starts
 * blank, a row key seeds from that row, and a `delete-` param seeds from that
 * same row but locks it. Nothing else distinguishes them, and nothing here
 * decides *when* to be each — that is the reuse rule in `openOrReuse` over the
 * params `@/lib/record-param` defines, and this component only reads the
 * consequence.
 *
 * Deleting is a form rather than a dialog because a dialog is a bad place to
 * read a record: it interrupts, it can't be left open while you check
 * something else, and it names a row or two where the fields name all of them.
 * A tab is none of those, and it costs nothing extra here — the readonly form
 * *is* the edit form with its inputs locked.
 *
 * Fields derive from the list's own `columns`, so a column added to a screen
 * shows up here without being restated — the same single-source rule the
 * filter row and the table already follow.
 *
 * Every action is a UI-only stub: there is no backend to save to or delete
 * from, so submit reports success and leaves the values on screen, and Process
 * closes the tab rather than pretending to persist anything.
 */
export function RecordForm<T>({
  label,
  noun,
  draftLabel,
  columns,
  rows,
  rowKey,
  param,
  screenType,
  tabId,
}: RecordFormProps<T>) {
  const workspace = useWorkspace()

  // What this tab is *for*, which the param carries along with which record —
  // see `@/lib/record-param`. Three modes over one set of fields, because the
  // fields are the same question in each: what does this record say? Creating
  // asks it of a blank one, editing of a saved one, deleting of one on its way
  // out.
  const kind = paramKind(param)
  const creating = kind === "draft"
  const deleting = kind === "delete"

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
    // A delete tab renders no submit button, but Enter in a field still asks
    // the form to submit — and "saved" is not a thing that can happen to a
    // record you are removing. Refusing here rather than not rendering a
    // `<form>` keeps the two modes one markup tree.
    if (deleting) return
    // UI-only stub: no persistence yet.
    setSaved(true)
  }

  // Process, and Cancel, and the tab's own ✕ all end the same way — this tab
  // goes away. Only the first of them claims to have deleted anything, and
  // even that is a UI-only stub, like submit; what it can honestly do is stop
  // showing you a record that is supposed to be gone.
  function closeSelf() {
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
        the registry's draft label, while editing and deleting name the *row*
        ("Edit item", "Delete item") — the chip carries the id, and "Edit
        Inventory" would claim to be editing the screen itself.
      */}
      {/*
        `gap-3`, matching the list's toolbar: it is what earns Close its
        "different kind of thing" standing beside the actions, which are
        stitched edge to edge inside the group and so have no gap of their own
        for this one to be mistaken for.
      */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="sr-only">
          {creating ? draftLabel : `${deleting ? "Delete" : "Edit"} ${noun}`}
        </h1>
        {/*
          The same `ToolbarGroup` the list's toolbar leads with, holding the
          same stock outline buttons at the same default size, so a list and a
          record read as one row seen at two altitudes. The pill ends come with
          it — see that module.
        */}
        <ToolbarGroup>
          {/*
            A delete tab is the same fields under a different question, so it
            is the same group under a different set of verbs — not a screen of
            its own. Nothing below is shared between the two branches on
            purpose: a record you are about to remove has nothing to save,
            nothing to clear, and no state to put on hold.
          */}
          {deleting ? (
            <>
              {/*
                Process is the irreversible click this whole tab exists to
                frame — so it takes the `destructive` variant, the colour every
                destructive action in the app takes, where the rest of the row
                is `outline`. It leads the row anyway: this is what you came
                here to do, and a red button leading a row is only alarming
                when the row didn't warn you, which the readonly fields below
                and the tab's own "Delete …" chip already did.

                A stub, like the rest — there is no backend to delete from —
                so what it actually does is stop showing you the record.
              */}
              {!missing && (
                <Button type="button" onClick={closeSelf} variant="destructive">
                  <Trash2 />
                  Process
                </Button>
              )}
              {/*
                Cancel is the way out, and it is why this branch renders no
                Close button: both would close the tab, and two buttons one gap
                apart doing the identical thing is worse than either alone.
                Cancel wins the slot because it answers the question the tab
                asked — the record is untouched, which "Close" doesn't say.

                Rendered whether or not a workspace answered: `closeSelf`
                tolerates the null, and a delete tab with no visible way out
                would be worse than a button that no-ops in a case that cannot
                arise. Close, which is optional chrome, is gated instead.
              */}
              <Button type="button" onClick={closeSelf} variant="outline">
                <X />
                Cancel
              </Button>
              {/*
                The same menu the edit form ends with, minus its Delete: you
                are already looking at one. What is left reads as the
                alternatives — Export it before it goes, or Archive it instead
                — which is exactly what a menu beside "Process" should offer.
              */}
              {!missing && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button type="button" variant="outline" />}
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
                            <DropdownMenuShortcut>
                              {shortcut}
                            </DropdownMenuShortcut>
                          )}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          ) : (
            <>
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
                <Button type="submit" form={formId} variant="outline">
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
                <Button type="button" variant="outline">
                  <BadgeCheck />
                  Verify
                </Button>
              )}
              {!creating && !missing && (
                <Button type="button" variant="outline">
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
            not sitting a destructive click beside Clear. It opens the record's
            delete tab rather than deleting — so a slip lands on a form asking
            the question, which is the same place the list's Delete lands.

            That tab is a *second* tab for this record, beside the one you are
            reading. The two carry different params and so can't collide, and
            the pair is the point: what a delete tab is for is being read next
            to the record it would remove.

            Editing only, like Verify and Hold: every action in it is about a
            record that exists.
          */}
              {!creating && !missing && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button type="button" variant="outline" />}
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
                            <DropdownMenuShortcut>
                              {shortcut}
                            </DropdownMenuShortcut>
                          )}
                        </DropdownMenuItem>
                      )
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() =>
                        workspace?.openTab({
                          screenType,
                          param: deleteParam(param),
                        })
                      }
                    >
                      <Trash2 strokeWidth={1.5} />
                      Delete {noun}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </ToolbarGroup>
        {/*
          Close stands outside the group, a `gap-3` away from its edge:
          everything in the group acts on the record — saves it, verifies it,
          holds it — while this one only puts the tab away, and the record is
          untouched either way. A stray click on the end of that group should
          not be able to close the tab.

          Closing is the workspace's job, so the button only exists inside one.
          It never isn't, in practice — but `useWorkspace` is allowed to answer
          null and this is cheaper than asserting it can't.

          Not on a delete tab, which carries Cancel in the group beside this
          one and needs no second button that does the same thing. See there.

          It takes the group's pill shape anyway — `rounded-full` outright,
          since on its own it is both ends of a run and needs none of
          `ToolbarGroup`'s end-finding. Standing apart is the gap's job, not
          the corners': a lone `lg` rectangle beside a pill would read as a
          different *kind* of control rather than as the same control held at
          arm's length.
        */}
        {workspace && !deleting && (
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => workspace.closeTab(tabId)}
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

      {/*
        The id, not the raw param: a delete tab's param carries a `delete-`
        prefix, and a message about a missing record should name the record
        rather than the token that addressed it.
      */}
      {missing ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No {noun} with the id{" "}
          <span className="font-medium">{recordId(param)}</span> in {label}. It
          may have been deleted since this tab was opened.
        </div>
      ) : (
        <>
          {/*
            The one line a delete tab adds to the form. The fields below say
            *what* the record is; nothing in them says it is about to go, and
            the toolbar's red is a colour rather than a sentence. It sits above
            the card rather than inside it because it is about the card.
          */}
          {deleting && (
            <p className="text-sm text-muted-foreground">
              This {noun} will be removed from {label}. Review it below, then
              Process — or Cancel to leave it alone. This can&apos;t be undone.
            </p>
          )}
          <form
            id={formId}
            onSubmit={handleSubmit}
            className="rounded-xl border bg-card p-4"
          >
            {/*
              The same shape as the advanced search card, down to the grouping
              helper: these fields *are* that card's columns, so a record and a
              search over records should not be two different ways of reading
              one list of headers.

              That means the columns are grouped before the grid sees them —
              `conditionGroups` fills a track before starting the next, so
              seven fields are 4/3 with the third track at `xl` simply empty,
              rather than the 3/2/2 of stubs a plain grid would place. Named
              for the search card because that is what asked for it first; the
              rule it encodes is about fields, not conditions.

              `gap-x-8` between tracks against the inner `gap-x-4` between a
              label and its field, for the same reason as there: the gap to the
              next column has to plainly beat the one inside a field, or the
              two read as one long row. `items-start` keeps a short last column
              topped out rather than stretched.
            */}
            <div className="grid grid-cols-1 items-start gap-x-8 gap-y-2 lg:grid-cols-2 xl:grid-cols-3">
              {conditionGroups(columns).map((group) => (
                <div
                  // The first field names the column — a positional key would
                  // let React reuse a column's inputs under a new set of
                  // fields when the screen behind the tab changes.
                  key={group[0].key}
                  className="grid grid-cols-[fit-content(8rem)_minmax(0,1fr)] items-center gap-x-4 gap-y-2"
                >
                  {group.map((column) => (
                    <React.Fragment key={column.key}>
                      {/*
                        `text-sm` and full colour, matching the input beside
                        it. Muted `text-xs` was right when the label sat above
                        the field and had to stay out of its way; on a shared
                        row it reads as a caption *about* a field rather than
                        the field's name.

                        `font-normal`, stated rather than left to inherit: the
                        label and the value it names carry the same weight, so
                        the pair reads as one thing. Bolding the label turns
                        the label track into a column of headers the eye stops
                        at on the way to every field.

                        `fit-content(8rem)` on the track sizes it to the
                        longest header in the column, so every input in a
                        column starts at the same x without a long header
                        eating the field's width — `truncate` handles the one
                        that overruns the cap.
                      */}
                      <label
                        htmlFor={`field-${column.key}`}
                        className="truncate text-sm font-normal"
                      >
                        {column.header}
                      </label>
                      {/*
                        `readOnly` rather than `disabled` on a delete tab. A
                        disabled input is skipped by the tab key and refuses to
                        be selected, and this form's whole job is to be *read*
                        — you should be able to tab through it and copy a value
                        out before the record goes. What must not happen is an
                        edit, which is exactly what `readOnly` stops.

                        The muted fill is what says so at a glance, since a
                        readonly input is otherwise indistinguishable from an
                        editable one. `cursor-default` drops the text caret the
                        field would otherwise still advertise.
                      */}
                      <Input
                        id={`field-${column.key}`}
                        value={values[column.key] ?? ""}
                        readOnly={deleting}
                        onChange={(event) => {
                          setValues((prev) => ({
                            ...prev,
                            [column.key]: event.target.value,
                          }))
                          setSaved(false)
                        }}
                        className={cn(
                          deleting &&
                            "cursor-default bg-muted/50 dark:bg-muted/50"
                        )}
                      />
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </form>
        </>
      )}
    </div>
  )
}
