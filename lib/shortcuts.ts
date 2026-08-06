/**
 * The app's keyboard shortcuts, declared once.
 *
 * A shortcut has two audiences that drift apart the moment they're written
 * twice: the handler that listens for the chord, and the surface that tells the
 * user it exists. The workspace's empty state already advertised ⌘K while
 * nothing on screen was listening for it, which is exactly that drift — so the
 * chord lives here, the handlers ask for their key by id, and the help popover
 * renders this list rather than a hand-written copy of it.
 *
 * Two fields, because a chord is read by a person and compared by a machine and
 * those aren't the same string. `keys` is what the user sees, in press order.
 * `eventKey` is what `KeyboardEvent.key.toLowerCase()` must equal — the chord's
 * final key only, since modifiers are matched off `event.metaKey`/`ctrlKey`
 * rather than by name. They're kept honest by {@link normalizeKeyLabel}, which
 * the test runs over every entry.
 */

/**
 * The platform modifier: ⌘ on a Mac, Ctrl everywhere else. Stays abstract here
 * so this module can be pure — `MetaKey` in `components/header-search.tsx`
 * resolves it at render, where the platform is knowable.
 */
export const MOD = "Mod"

export type Shortcut = {
  id: string
  /** The chord as the user reads it, in press order. {@link MOD} renders per platform. */
  keys: readonly string[]
  /** The chord's final key, as `KeyboardEvent.key.toLowerCase()` reports it. */
  eventKey: string
  /** What pressing it does, phrased as the action. */
  label: string
  /** When it doesn't apply, or what it applies to. */
  note?: string
}

/**
 * The declarations. Order is the order the help popover lists them: the two
 * that work anywhere first, then the two that depend on where you are.
 */
const shortcutDefs = [
  {
    id: "search",
    keys: [MOD, "K"],
    eventKey: "k",
    label: "Search screens",
    note: "Opens the command palette",
  },
  {
    id: "toggle-sidebar",
    keys: [MOD, "B"],
    eventKey: "b",
    label: "Toggle the sidebar",
  },
  {
    id: "toggle-theme",
    keys: ["D"],
    eventKey: "d",
    label: "Switch light and dark",
    note: "Ignored while typing",
  },
  {
    id: "dismiss-panel",
    keys: ["Esc"],
    eventKey: "escape",
    label: "Dismiss the sidebar panel",
    note: "Only while it's floating, not pinned",
  },
] as const satisfies readonly Shortcut[]

/**
 * The ids, as a union, so {@link shortcutEventKey} takes a real shortcut rather
 * than any old string — a typo becomes a type error instead of a handler that
 * silently never fires. Read off the `as const` literals above, which is also
 * why the list is exported through {@link shortcuts} at its declared type: the
 * literal type makes `note` absent (not optional) on the entries that lack one,
 * and a renderer iterating the list has to be able to ask every entry for it.
 */
export type ShortcutId = (typeof shortcutDefs)[number]["id"]

/** Every shortcut the app answers to, in the order the help popover lists them. */
export const shortcuts: readonly Shortcut[] = shortcutDefs

/**
 * The keys whose label and `KeyboardEvent.key` differ. Everything else is the
 * label lowercased — `K` is `"k"`, `D` is `"d"`.
 */
const EVENT_KEY_BY_LABEL: Record<string, string> = { esc: "escape" }

/** The `KeyboardEvent.key` a displayed key label stands for, lowercased. */
export function normalizeKeyLabel(label: string): string {
  const lower = label.toLowerCase()
  return EVENT_KEY_BY_LABEL[lower] ?? lower
}

/**
 * The key a handler for this shortcut should compare against, so no handler
 * spells its own chord. Modifiers aren't included — a handler checks
 * `event.metaKey || event.ctrlKey` itself, which is what tells ⌘K from a bare K.
 */
export function shortcutEventKey(id: ShortcutId): string {
  const shortcut = shortcuts.find((s) => s.id === id)
  if (!shortcut) throw new Error(`Unknown shortcut: ${id}`)
  return shortcut.eventKey
}

/**
 * Whether this chord needs the platform modifier held. Derived from the keys
 * rather than declared again, so a chord can't claim one and match the other.
 */
export function needsMod(shortcut: Shortcut): boolean {
  return shortcut.keys.includes(MOD)
}
