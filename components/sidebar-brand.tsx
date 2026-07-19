"use client"

import { Button } from "@/components/ui/button"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebarPin } from "@/components/sidebar-shell"
import { cn } from "@/lib/utils"
import { collapsedRailButton, collapsedRailLabel } from "@/lib/sidebar-metrics"
import { PanelLeftIcon } from "lucide-react"

/**
 * The sidebar header: the workspace it belongs to, plus the collapse button.
 *
 * Static — there is one workspace, so what used to be a switcher offered a
 * menu with a single item and a chevron promising a choice that did not
 * exist. The row is no longer a button at all; `SidebarMenuButton` stays only
 * for the rail sizing and layout every other sidebar row shares.
 */
export function SidebarBrand({
  workspace,
}: {
  workspace: { name: string; logo: React.ReactNode; plan: string }
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          // Not interactive, so it should not answer the pointer like the nav
          // rows below it do.
          className={cn("hover:bg-transparent", collapsedRailButton)}
          render={<div />}
        >
          <div
            className={cn(
              "flex aspect-square size-8 items-center justify-center",
              // On the rail the mark is the brand, not another nav icon — it
              // reads as the header of the column, so it runs larger than the
              // 20px glyphs below while still leaving the 40px tile a margin.
              "group-data-[collapsible=icon]:size-7"
            )}
          >
            {workspace.logo}
          </div>
          <div
            className={cn(
              "grid flex-1 text-left text-sm leading-tight",
              collapsedRailLabel
            )}
          >
            <span className="truncate font-medium">{workspace.name}</span>
            <span className="truncate text-xs">{workspace.plan}</span>
          </div>
          <CollapseButton />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/**
 * Collapses the sidebar to the rail — the mirror of the footer's expand
 * button, which is what brings it back. One direction each, so neither button
 * is a toggle whose effect the user has to infer from the current state.
 *
 * Rendered only when the sidebar is open: on the rail there is no room beside
 * the brand mark, and collapsing an already-collapsed sidebar is a no-op.
 */
function CollapseButton() {
  const { setPinned } = useSidebarPin()
  const label = "Collapse sidebar"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            className={cn("ml-auto size-7", collapsedRailLabel)}
            onClick={() => setPinned(false)}
          >
            <PanelLeftIcon strokeWidth={1.5} />
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
