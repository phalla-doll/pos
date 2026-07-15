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
import type { NavEntry, Screen } from "@/lib/screens"
import { ChevronRight } from "lucide-react"

/**
 * Primary sidebar navigation. Renders the nav tree from @/lib/screens:
 * flat entries are *tab launchers* (navigate to /dashboard?tab=<type>,
 * which the workspace reads to open or focus that screen's tab), and
 * groups are collapsible parents whose children are launchers.
 */
export function NavMain({ items }: { items: NavEntry[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          item.kind === "group" ? (
            <NavGroup
              key={item.label}
              label={item.label}
              icon={item.icon}
              children={item.children}
            />
          ) : (
            <SidebarMenuItem key={item.screen.type}>
              <SidebarMenuButton
                tooltip={item.screen.label}
                render={<Link href={`/dashboard?tab=${item.screen.type}`} />}
              >
                {item.screen.icon}
                <span>{item.screen.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

/**
 * A collapsible sidebar group. The trigger shows the group's icon + label
 * and a chevron that rotates when open; the panel holds the child launchers.
 * Defaults to open so all screens are discoverable at a glance.
 */
function NavGroup({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: Screen[]
}) {
  return (
    <Collapsible defaultOpen render={<SidebarMenuItem />}>
      <CollapsibleTrigger
        render={
          <SidebarMenuButton tooltip={label} className="group/collapsible">
            {icon}
            <span>{label}</span>
            <ChevronRight
              strokeWidth={2}
              className="ml-auto transition-transform duration-200 group-data-[panel-open]/collapsible:rotate-90"
            />
          </SidebarMenuButton>
        }
      />
      <CollapsibleContent>
        <SidebarMenuSub>
          {children.map((child) => (
            <SidebarMenuSubItem key={child.type}>
              <SidebarMenuSubButton
                render={<Link href={`/dashboard?tab=${child.type}`} />}
              >
                {child.icon}
                <span>{child.label}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}
