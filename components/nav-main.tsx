"use client"

import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useTabLauncherHref } from "@/hooks/use-tabs"
import { cn } from "@/lib/utils"
import type { NavEntry } from "@/lib/nav"
import type { ScreenType } from "@/lib/screens"
import { ChevronRight } from "lucide-react"

/**
 * {@link NavMain} wired to the live URL, so each launcher preserves the tabs
 * already open. Reads search params, so it must render inside `<Suspense>` —
 * `components/app-sidebar.tsx` owns that boundary and its fallback.
 *
 * The href depends on the whole workspace, so it's resolved once here and
 * threaded down rather than subscribing every node to the URL.
 */
export function NavMainLive({ items }: { items: NavEntry[] }) {
  return <NavMain items={items} hrefFor={useTabLauncherHref()} />
}

/**
 * Primary sidebar navigation. Renders the nav tree from @/lib/nav: screen
 * entries are *tab launchers* (links to the workspace URL with that screen
 * opened or focused), and groups are collapsible parents whose children are
 * themselves nav entries — so the same {@link NavNode} recurses to any depth.
 *
 * Presentational: `hrefFor` is injected so this renders identically with or
 * without the URL in hand — which is what lets it serve as its own Suspense
 * fallback.
 */
export function NavMain({
  items,
  hrefFor,
}: {
  items: NavEntry[]
  hrefFor: (screenType: ScreenType) => string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu className="gap-1.5">
        {items.map((item) => (
          <NavNode
            key={subKey(item)}
            entry={item}
            depth={0}
            hrefFor={hrefFor}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

/**
 * One nav entry, rendered recursively. A single code path handles both a
 * `screen` leaf (a tab launcher) and a collapsible `group`; the link is
 * constructed once and the trigger content is shared. The only thing that
 * varies with depth is which sidebar primitives wrap it — top-level entries
 * use the menu primitives (a `<button>` with a collapsed-rail tooltip), nested
 * ones use the sub-menu primitives (an `<a>`). Groups default to open so every
 * screen is discoverable at a glance.
 */
function NavNode({
  entry,
  depth,
  hrefFor,
}: {
  entry: NavEntry
  depth: number
  hrefFor: (screenType: ScreenType) => string
}) {
  const top = depth === 0

  if (entry.kind === "screen") {
    const { screen } = entry
    const link = <Link href={hrefFor(screen.type)} />
    const content = (
      <>
        {screen.icon}
        <span>{screen.label}</span>
      </>
    )
    return top ? (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={screen.label}
          className="h-10"
          render={link}
        >
          {content}
        </SidebarMenuButton>
      </SidebarMenuItem>
    ) : (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton className="h-8" render={link}>
          {content}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }

  // Group: a collapsible whose panel holds its children, each recursing. The
  // chevron rotates via its own button's `group/*` scope, so nesting is safe.
  const Item = top ? SidebarMenuItem : SidebarMenuSubItem
  const triggerContent = (
    <>
      {entry.icon}
      <span>{entry.label}</span>
      <ChevronRight
        strokeWidth={2}
        className={cn(
          "ml-auto transition-transform duration-200",
          top
            ? "group-data-[panel-open]/collapsible:rotate-90"
            : "group-data-[panel-open]/collapsible-sub:rotate-90"
        )}
      />
    </>
  )
  const panel = (
    <CollapsibleContent>
      {/* Drop the container's right inset (keep the left indent) so a nested
          group's ml-auto chevron reaches the same right edge as top-level
          chevrons instead of sitting offset by one indent level. */}
      <SidebarMenuSub className="!mr-0 !pr-0">
        {entry.children.map((child) => (
          <NavNode
            key={subKey(child)}
            entry={child}
            depth={depth + 1}
            hrefFor={hrefFor}
          />
        ))}
      </SidebarMenuSub>
    </CollapsibleContent>
  )

  return (
    <Collapsible defaultOpen render={<Item />}>
      {top ? (
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              tooltip={entry.label}
              className="group/collapsible h-10"
            >
              {triggerContent}
            </SidebarMenuButton>
          }
        />
      ) : (
        <CollapsibleTrigger
          nativeButton={false}
          render={
            <SidebarMenuSubButton className="group/collapsible-sub h-8">
              {triggerContent}
            </SidebarMenuSubButton>
          }
        />
      )}
      {panel}
    </Collapsible>
  )
}

/** Stable React key for an entry: screen type for leaves, label for groups. */
function subKey(entry: NavEntry): string {
  return entry.kind === "screen" ? entry.screen.type : entry.label
}
