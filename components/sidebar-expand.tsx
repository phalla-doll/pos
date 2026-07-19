"use client"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebarPin } from "@/components/sidebar-shell"
import { cn } from "@/lib/utils"
import { collapsedRailButton } from "@/lib/sidebar-metrics"
import { PanelLeftIcon } from "lucide-react"

/**
 * The rail's way back out. Nothing expands the sidebar on its own — no hover,
 * no focus — so a collapsed rail needs an affordance that is visibly *there*
 * rather than a chord (⌘B) or the hairline rail to be discovered.
 *
 * It sits in the footer above the user row, the one place on the rail the eye
 * already returns to, and only while collapsed: expanded, the header's pin is
 * the control and a second toggle would just be a duplicate.
 *
 * Rendered by CSS rather than by branching on state, so it costs no
 * subscription to the sidebar and never disagrees with the rail it lives on —
 * `data-collapsible=icon` is the same flag every other rail style keys off.
 */
export function SidebarExpandButton() {
  const { setPinned } = useSidebarPin()

  return (
    <SidebarMenu className="hidden group-data-[collapsible=icon]:block">
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="Expand sidebar"
          aria-label="Expand sidebar"
          className={cn("h-10", collapsedRailButton)}
          onClick={() => setPinned(true)}
        >
          <PanelLeftIcon strokeWidth={1.5} />
          <span>Expand</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
