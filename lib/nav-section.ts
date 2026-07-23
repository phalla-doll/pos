import type { NavEntry } from "@/lib/nav"
import type { ScreenType } from "@/lib/screens"

/**
 * Two-pane sidebar geometry, derived from the one nav tree.
 *
 * The rail (pane 1) lists every top-level entry; the detail panel (pane 2)
 * shows one *section* at a time — a top-level **group** and its subtree. A
 * top-level leaf owns no section: it launches directly and collapses the panel
 * (there is nothing to list). So "which section" is always the label of a
 * top-level group, and these pure helpers are how the rail and the panel agree
 * on it without either restating the tree.
 *
 * Everything takes the tree as an argument rather than importing `sidebarNav`,
 * so the algebra is unit-testable over a fixture with no React or icons.
 */

/** A group entry — the narrowed half of {@link NavEntry}. */
export type GroupEntry = Extract<NavEntry, { kind: "group" }>

/**
 * The top-level group entries, in display order — the sections that can fill
 * pane 2. Top-level leaves are excluded: they have no children to show.
 */
export function topLevelGroups(nav: NavEntry[]): GroupEntry[] {
  return nav.filter((e): e is GroupEntry => e.kind === "group")
}

/**
 * The label of the first top-level group — the section pane 2 falls back to
 * when nothing else selects one (a fresh load on a leaf screen, say). Null only
 * if the tree has no groups at all.
 */
export function firstGroupLabel(nav: NavEntry[]): string | null {
  return topLevelGroups(nav)[0]?.label ?? null
}

/** The top-level group with this label, or null when none matches. */
export function findTopLevelGroup(
  nav: NavEntry[],
  label: string
): GroupEntry | null {
  return topLevelGroups(nav).find((g) => g.label === label) ?? null
}

/**
 * Walk a path of group labels from the top down and return the group it lands
 * on — the one whose children pane 2 should list. `path[0]` names a top-level
 * section; each later label names a nested group one level deeper, which is how
 * pane 2 drills in (`["Admin Tools", "System", "Maintenance"]` lands on
 * Maintenance). Matching is per level, so labels need only be unique among
 * their siblings. Returns null if any label matches no group at its level, or
 * for an empty path.
 */
export function groupAtPath(
  nav: NavEntry[],
  path: string[]
): GroupEntry | null {
  let level = nav
  let node: GroupEntry | null = null
  for (const label of path) {
    const found = level.find(
      (e): e is GroupEntry => e.kind === "group" && e.label === label
    )
    if (!found) return null
    node = found
    level = found.children
  }
  return node
}

/** Whether `screenType` appears anywhere in this entry's subtree. */
function subtreeContains(entry: NavEntry, screenType: ScreenType): boolean {
  return entry.kind === "screen"
    ? entry.screen.type === screenType
    : entry.children.some((c) => subtreeContains(c, screenType))
}

/**
 * The label of the top-level group whose subtree contains `screenType` — the
 * section pane 2 should open to for the currently focused screen. Returns null
 * when the screen is a top-level leaf (owned by no group), isn't in the tree,
 * or when `screenType` is null (nothing focused). Matching descends the whole
 * subtree, so a screen nested four levels deep still resolves to its top-level
 * section.
 */
export function defaultSectionLabel(
  nav: NavEntry[],
  screenType: ScreenType | null
): string | null {
  if (!screenType) return null
  const owner = topLevelGroups(nav).find((g) => subtreeContains(g, screenType))
  return owner?.label ?? null
}
