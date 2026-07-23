"use client"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

/**
 * The sidebar header: the workspace mark, shown as a compact tile.
 *
 * In the two-pane sidebar the brand sits at the top of the icon rail, which is
 * statically narrow, so it is the logo alone — the name would have nowhere to
 * go. It is not interactive (there is one workspace, so a switcher would offer
 * a menu of one); `SidebarMenuButton` stays only for the rail sizing and layout
 * every other rail row shares.
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
          aria-label={workspace.name}
          className="size-10! justify-center p-0! hover:bg-transparent"
          render={<div />}
        >
          <div className="flex size-7 items-center justify-center [&_svg]:size-5!">
            {workspace.logo}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
