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
import { Pin, PinOff } from "lucide-react"

/**
 * The sidebar header: the workspace it belongs to, plus the pin.
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
          <PinButton />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/**
 * Toggles whether the sidebar stays open. Rendered only when the sidebar is
 * open — on the rail there is no room, and a peek is the wrong moment to
 * offer it: the button would sit under a cursor that is only passing through.
 * The header's own trigger (⌘B) pins from the outside, so the rail is never a
 * dead end.
 */
function PinButton() {
  const { pinned, setPinned } = useSidebarPin()
  const Icon = pinned ? PinOff : Pin
  const label = pinned ? "Unpin sidebar" : "Pin sidebar"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            aria-pressed={pinned}
            className={cn("ml-auto size-7", collapsedRailLabel)}
            onClick={() => setPinned(!pinned)}
          >
            <Icon strokeWidth={1.5} />
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
