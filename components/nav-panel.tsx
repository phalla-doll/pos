"use client"

import Link from "next/link"
import { ChevronRight, Star } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { FavoriteSection } from "@/lib/favorites"
import {
  groupNavCommandsByPath,
  type NavCommand,
  type NavEntry,
} from "@/lib/nav"
import type { Screen, ScreenType } from "@/lib/screens"
import type { ScreenRef } from "@/lib/tab-identity"
import { cn } from "@/lib/utils"

/**
 * The star that marks a screen as a favorite, sitting at the right edge of a
 * leaf row as a {@link SidebarMenuAction} — a sibling of the row's launcher
 * button, not nested in its link, so toggling never also navigates. Hidden
 * until the row is hovered or focused *unless* the screen is already a favorite,
 * in which case it stays lit so the current marks are visible at a glance.
 */
function FavoriteToggle({
  type,
  favorite,
}: {
  type: ScreenType
  favorite: FavoriteControls
}) {
  const marked = favorite.isFavorite(type)
  return (
    <SidebarMenuAction
      className={cn(
        // The rows are taller than the vendored default the action anchors to
        // (`top-1.5`), so re-center it on the h-10 row. The peer-variant
        // override matches the base's specificity and sorts after it, so it
        // wins. `right-2` lines its inset up with the row's own `p-2`.
        "top-1/2 right-2 -translate-y-1/2 transition-opacity peer-data-[size=default]/menu-button:top-1/2",
        // Kept deliberately dim so the star never competes with the row's label
        // and icon for contrast; it lifts to full opacity only on a *direct*
        // hover or focus of the star itself (the `!` beats the reveal below,
        // whatever the class order). A marked star rests visibly dim; an unmarked
        // one is hidden until the row is hovered, then only faintly.
        "hover:opacity-100! focus-visible:opacity-100!",
        marked
          ? "opacity-45"
          : "opacity-0 group-focus-within/menu-item:opacity-45 group-hover/menu-item:opacity-45"
      )}
      aria-label={marked ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={marked}
      onClick={(e) => {
        // The launcher is a sibling, but a stray bubble shouldn't reach the row.
        e.preventDefault()
        e.stopPropagation()
        favorite.onToggle(type)
      }}
    >
      <Star className={cn(marked && "fill-current")} strokeWidth={1.5} />
    </SidebarMenuAction>
  )
}

/** Read and toggle a screen's favorite state — passed down from the workspace. */
export type FavoriteControls = {
  isFavorite: (type: ScreenType) => boolean
  onToggle: (type: ScreenType) => void
}

/**
 * One launcher row: a link that opens the screen as a tab, reading as active
 * when it is the focused one, with the marking star at its right edge.
 *
 * All three of pane 2's lists — the drill level, the search results, and the
 * favorites — are lists *of this*, and differ only in how they gather and group
 * the screens they show. Keeping the row itself in one place is what stops the
 * three from drifting: the row height, the active rule, and the star are stated
 * once and land everywhere.
 *
 * Clicking calls `onNavigate`, which is how an unpinned panel gets out of the
 * way once a screen is picked. The star is a sibling of the launcher rather
 * than a child (see {@link FavoriteToggle}), so it is omitted outright — never
 * merely inert — when no `favorite` control is given.
 */
function ScreenRow({
  screen,
  hrefFor,
  focusedType,
  onNavigate,
  favorite,
}: {
  screen: Screen
  hrefFor: (ref: ScreenRef) => string
  focusedType: ScreenType | null
  onNavigate?: () => void
  favorite?: FavoriteControls
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="h-10"
        isActive={focusedType === screen.type}
        render={
          <Link
            href={hrefFor({ screenType: screen.type })}
            onClick={onNavigate}
          />
        }
      >
        {screen.icon}
        <span>{screen.label}</span>
      </SidebarMenuButton>
      {favorite && <FavoriteToggle type={screen.type} favorite={favorite} />}
    </SidebarMenuItem>
  )
}

/**
 * One level of pane 2, rendered as a *drill-in* list rather than a collapsing
 * tree: it shows exactly `items` — the top-level menu at the root, or one
 * group's children once drilled in — and going deeper replaces the level
 * instead of expanding it inline (see the path stack in
 * `components/app-sidebar.tsx`).
 *
 * The two kinds of entry differ in what a click does — the whole reason the
 * panel drills rather than toggles:
 *
 * - A **leaf** is a launcher: a real link that opens the screen as a tab, and
 *   reads as active when it's the focused one. Clicking one also calls
 *   `onNavigate`, which is how an unpinned panel gets out of the way once a
 *   screen is picked. When `favorite` is given, a star lets the leaf be marked.
 * - A **group** is a step deeper: clicking it pushes onto the panel's path
 *   (`onDrill`), so its own children take over the panel. The trailing chevron
 *   points *right* to say "opens a level", not down to say "expands here".
 */
export function NavPanel({
  items,
  hrefFor,
  onDrill,
  focusedType,
  onNavigate,
  favorite,
}: {
  items: NavEntry[]
  hrefFor: (ref: ScreenRef) => string
  onDrill: (label: string) => void
  focusedType: ScreenType | null
  onNavigate?: () => void
  favorite?: FavoriteControls
}) {
  return (
    <SidebarGroup>
      <SidebarMenu className="gap-0.5">
        {items.map((child) =>
          child.kind === "screen" ? (
            <ScreenRow
              key={child.screen.type}
              screen={child.screen}
              hrefFor={hrefFor}
              focusedType={focusedType}
              onNavigate={onNavigate}
              favorite={favorite}
            />
          ) : (
            <SidebarMenuItem key={child.label}>
              <SidebarMenuButton
                className="h-10"
                onClick={() => onDrill(child.label)}
              >
                {child.icon}
                <span>{child.label}</span>
                <ChevronRight strokeWidth={1.5} className="ml-auto" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

/**
 * Pane 2's search view: the screens matching the query, shown in place of the
 * drill list while there is a query. Every row is a launcher (no drilling —
 * search collapses the hierarchy), but the matches are grouped by their
 * breadcrumb, each group under a heading. Location reads once, above its rows,
 * instead of trailing every row with a breadcrumb that just truncates next to a
 * wrapping label — while still keeping two same-named screens in different
 * sections tellable apart. `commands` is already filtered and scoped by the
 * caller; this only groups and renders. A `favorite` control adds the marking
 * star, so a screen can be starred straight from a search result.
 */
export function NavSearchResults({
  commands,
  hrefFor,
  focusedType,
  onNavigate,
  favorite,
}: {
  commands: NavCommand[]
  hrefFor: (ref: ScreenRef) => string
  focusedType: ScreenType | null
  onNavigate?: () => void
  favorite?: FavoriteControls
}) {
  if (commands.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        No matching screens.
      </div>
    )
  }

  const sections = groupNavCommandsByPath(commands, "Screens")

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.heading} className="py-1">
          <SidebarGroupLabel>{section.heading}</SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            {section.commands.map(({ screen }) => (
              <ScreenRow
                key={screen.type}
                screen={screen}
                hrefFor={hrefFor}
                focusedType={focusedType}
                onNavigate={onNavigate}
                favorite={favorite}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}

/**
 * Pane 2's Favorites view: the starred screens as a flat list with no drilling,
 * separated into one labelled group per top-level section. `sections` is
 * already derived and ordered by the caller (see `favoriteSections`); this only
 * renders. Every row carries the marking star too, so the panel is also where a
 * favorite is *removed* — unstarring drops it from the list on the next render.
 * An empty set shows a hint rather than a blank panel.
 */
export function NavFavoritesPanel({
  sections,
  hrefFor,
  focusedType,
  onNavigate,
  favorite,
}: {
  sections: FavoriteSection[]
  hrefFor: (ref: ScreenRef) => string
  focusedType: ScreenType | null
  onNavigate?: () => void
  favorite: FavoriteControls
}) {
  if (sections.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-muted-foreground">
        No favorites yet. Star a screen in the menu to pin it here.
      </div>
    )
  }

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label ?? " general"} className="py-1">
          {/* Top-level leaves belong to no section, so they gather under a
              catch-all heading rather than showing an empty one. */}
          <SidebarGroupLabel>{section.label ?? "General"}</SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            {section.screens.map((screen) => (
              <ScreenRow
                key={screen.type}
                screen={screen}
                hrefFor={hrefFor}
                focusedType={focusedType}
                onNavigate={onNavigate}
                favorite={favorite}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
