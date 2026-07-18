"use client"

import * as React from "react"

import { NavMain, NavMainLive } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { SidebarBrand } from "@/components/sidebar-brand"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { sidebarNav } from "@/lib/nav"
import { freshWorkspaceHref } from "@/lib/tab-url"
import { sidebarUser, sidebarWorkspace } from "@/lib/fixtures"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarBrand workspace={sidebarWorkspace} />
      </SidebarHeader>
      <SidebarContent>
        {/*
          NavMainLive reads the URL to build launcher hrefs that preserve the
          open tabs, which means it can't be prerendered. The fallback is the
          same nav in its degraded-but-working form: every link opens its
          screen in a fresh workspace. So the static HTML ships a usable
          sidebar and the client upgrades the hrefs in place — no skeleton, no
          flash, and no link that lies about where it goes.
        */}
        <React.Suspense
          fallback={<NavMain items={sidebarNav} hrefFor={freshWorkspaceHref} />}
        >
          <NavMainLive items={sidebarNav} />
        </React.Suspense>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
