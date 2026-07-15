"use client"

import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { Screen } from "@/lib/screens"

/**
 * Primary sidebar navigation. Each item is a *tab launcher*: clicking it
 * navigates to /dashboard?tab=<screenType>, which the workspace reads to
 * open or focus that screen's tab. Items are flat (no expand/collapse)
 * because a launcher opens a tab directly — it has no sub-pages.
 */
export function NavMain({ items }: { items: Screen[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.type}>
            <SidebarMenuButton
              tooltip={item.label}
              render={<Link href={`/dashboard?tab=${item.type}`} />}
            >
              {item.icon}
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
