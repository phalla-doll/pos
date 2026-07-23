import { flattenNav, type NavEntry } from "@/lib/nav"
import type { Screen, ScreenType } from "@/lib/screens"

/**
 * Favorites: the set of screens the user has starred, as pure algebra over a
 * list of {@link ScreenType}.
 *
 * The persisted form is a comma-separated string of screen types (see
 * `hooks/use-favorites.ts` for the localStorage adapter). Everything here is
 * plain data in / plain data out with no React or browser access, so the
 * membership rules and the grouped-for-display derivation are unit-testable on
 * their own — the same split the tabs reducer and nav helpers use.
 *
 * Order is not meaningful in the stored list: the displayed order comes from
 * the nav tree (see {@link favoriteSections}), so the store only records
 * *which* screens are favorites, not in what sequence they were marked.
 */

/**
 * Parse a persisted favorites string into the valid screen types it names.
 * Unknown, empty, or duplicate tokens are dropped, so a hand-edited store — or
 * one holding a screen that has since been removed from the registry — can
 * never inject a type the rest of the app would have to defend against. `valid`
 * is injected (rather than importing `screenKeys`) to keep this pure and
 * testable over a fixture.
 */
export function parseFavorites(
  raw: string,
  valid: readonly ScreenType[]
): ScreenType[] {
  const allow = new Set(valid)
  const seen = new Set<ScreenType>()
  const out: ScreenType[] = []
  for (const part of raw.split(",")) {
    const type = part.trim() as ScreenType
    if (allow.has(type) && !seen.has(type)) {
      seen.add(type)
      out.push(type)
    }
  }
  return out
}

/** Serialize a favorites list for persistence — the inverse of {@link parseFavorites}. */
export function serializeFavorites(favorites: readonly ScreenType[]): string {
  return favorites.join(",")
}

/**
 * Toggle one screen's membership: remove it if present, else append it. Returns
 * a new list (never mutates), so it composes cleanly with an external store's
 * "read, transform, write" cycle.
 */
export function toggleFavorite(
  favorites: readonly ScreenType[],
  type: ScreenType
): ScreenType[] {
  return favorites.includes(type)
    ? favorites.filter((t) => t !== type)
    : [...favorites, type]
}

/**
 * A run of favorited screens sharing one top-level section — the unit the
 * Favorites panel renders under a single heading. `label` is the top-level
 * group's name, or null for screens that are top-level leaves and belong to no
 * section (Dashboard, Settings, …); the panel renders those under a catch-all
 * heading of its own choosing.
 */
export type FavoriteSection = {
  label: string | null
  screens: Screen[]
}

/**
 * Group the favorited screens by their top-level section, for the flat (but
 * separated) Favorites panel. Derived from {@link flattenNav} so display order
 * follows the sidebar's own order and a screen's section is read from the one
 * nav tree rather than restated — the same single-source rule the menu obeys.
 *
 * Screens are bucketed by section label (nesting deeper than the top level is
 * flattened away — favorites have no drill levels), keyed on first appearance
 * so the section order matches the nav. A screen not currently in the favorites
 * set is skipped; an empty set yields no sections.
 */
export function favoriteSections(
  nav: NavEntry[],
  favorites: readonly ScreenType[]
): FavoriteSection[] {
  const fav = new Set(favorites)
  const byLabel = new Map<string | null, Screen[]>()
  for (const { screen, path } of flattenNav(nav)) {
    if (!fav.has(screen.type)) continue
    const label = path[0] ?? null
    const bucket = byLabel.get(label)
    if (bucket) bucket.push(screen)
    else byLabel.set(label, [screen])
  }
  return [...byLabel].map(([label, screens]) => ({ label, screens }))
}
