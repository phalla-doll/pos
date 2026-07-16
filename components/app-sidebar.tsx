"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavTheme } from "@/components/nav-theme"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { sidebarNav } from "@/lib/nav"
import { sidebarTeams, sidebarUser } from "@/lib/fixtures"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarTeams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavTheme />
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
