import {
  Archive,
  ClipboardCheck,
  Copy,
  Download,
  FolderInput,
  PackagePlus,
  Printer,
  Tag,
  type LucideIcon,
} from "lucide-react"

/**
 * What can be done to a record, listed once.
 *
 * Every entry is a UI-only stub until there is a backend — they exist so the
 * flows around them can be demoed end to end — so none carries a handler. That
 * is exactly why they are data: three surfaces offer this same set (the list's
 * More menu, a row's context menu, and a record form's More menu), and a stub
 * spelled out three times is three places for the wording to drift.
 *
 * The two groups are a ranking, not a taxonomy: `primaryRowActions` are what a
 * menu leads with, `secondaryRowActions` sit below a divider from them. Each
 * surface draws that divider itself, since where a group *ends up* — inline, in
 * a submenu, above a Delete — is the surface's business and not this list's.
 *
 * No `rowWord` here, and no counts: a label is the bare verb, and the surface
 * that acts on a multi-row selection is the one that knows to say "Export 3
 * rows". A record form has exactly one record and says "Export".
 *
 * Untested on purpose, against the repo's usual rule. There is no logic to
 * pin down — a test over a literal array could only restate it, and would then
 * have to be edited every time the list is, which is the opposite of what a
 * test is for. What *is* worth checking lives with the surfaces that read it.
 */
export type RowAction = {
  label: string
  icon: LucideIcon
  shortcut?: string
}

/** The actions a menu leads with. */
export const primaryRowActions: RowAction[] = [
  { label: "Export", icon: Download },
  { label: "Duplicate", icon: Copy },
  { label: "Archive", icon: Archive },
]

/** Lower-traffic actions, sat below a divider from the primary ones. */
export const secondaryRowActions: RowAction[] = [
  { label: "Assign tag", icon: Tag, shortcut: "⌘T" },
  { label: "Change category", icon: FolderInput },
  { label: "Adjust stock", icon: PackagePlus },
  { label: "Print labels", icon: Printer, shortcut: "⌘P" },
  { label: "Mark as counted", icon: ClipboardCheck },
]
