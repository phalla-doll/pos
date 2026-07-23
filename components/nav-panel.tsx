"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { NavCommand, NavEntry } from "@/lib/nav"
import type { ScreenType } from "@/lib/screens"
import type { ScreenRef } from "@/lib/tab-identity"

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
 *   reads as active when it's the focused one.
 * - A **group** is a step deeper: clicking it pushes onto the panel's path
 *   (`onDrill`), so its own children take over the panel. The trailing chevron
 *   points *right* to say "opens a level", not down to say "expands here".
 */
export function NavPanel({
  items,
  hrefFor,
  onDrill,
  focusedType,
}: {
  items: NavEntry[]
  hrefFor: (ref: ScreenRef) => string
  onDrill: (label: string) => void
  focusedType: ScreenType | null
}) {
  return (
    <SidebarGroup>
      <SidebarMenu className="gap-0.5">
        {items.map((child) =>
          child.kind === "screen" ? (
            <SidebarMenuItem key={child.screen.type}>
              <SidebarMenuButton
                className="h-10"
                isActive={focusedType === child.screen.type}
                render={
                  <Link href={hrefFor({ screenType: child.screen.type })} />
                }
              >
                {child.screen.icon}
                <span>{child.screen.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
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
 * Pane 2's search view: the flat list of screens matching the query, shown in
 * place of the drill list while there is a query. Every row is a launcher (no
 * drilling — search collapses the hierarchy), trailed by its breadcrumb so two
 * same-named screens in different sections stay tellable apart. `commands` is
 * already filtered and scoped by the caller; this only renders.
 */
export function NavSearchResults({
  commands,
  hrefFor,
  focusedType,
}: {
  commands: NavCommand[]
  hrefFor: (ref: ScreenRef) => string
  focusedType: ScreenType | null
}) {
  if (commands.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        No matching screens.
      </div>
    )
  }

  return (
    <SidebarGroup>
      <SidebarMenu className="gap-0.5">
        {commands.map(({ screen, path }) => (
          <SidebarMenuItem key={screen.type}>
            <SidebarMenuButton
              className="h-10"
              isActive={focusedType === screen.type}
              render={<Link href={hrefFor({ screenType: screen.type })} />}
            >
              {screen.icon}
              <span>{screen.label}</span>
              {path.length > 0 && (
                <span className="ml-auto truncate text-xs text-muted-foreground">
                  {path.join(" › ")}
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
