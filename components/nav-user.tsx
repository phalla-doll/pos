"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeMenuSub } from "@/components/nav-theme"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Sparkles, BadgeCheck, CreditCard, Bell, LogOut } from "lucide-react"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    lastSignedOn: string
    loginAttempts: number
    company: string
    companyCode: string
    businessDate: string
  }
}) {
  const { isMobile } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {/* Avatar-only, to sit in the narrow icon rail. The name and email
              still head the menu below, where there is room for them. */}
          <DropdownMenuTrigger
            aria-label={user.name}
            render={
              <SidebarMenuButton
                size="lg"
                className="size-10! justify-center p-0! aria-expanded:bg-muted"
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex flex-col gap-3 px-1 py-1.5 text-left">
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                  {/* The same session/company facts the profile panel shows,
                      kept in step with it by reading the one fixture. */}
                  <dl className="grid gap-1.5 text-xs">
                    <InfoRow
                      label="Company"
                      value={`${user.company} (${user.companyCode})`}
                    />
                    <InfoRow label="Business date" value={user.businessDate} />
                    <InfoRow label="Last signed on" value={user.lastSignedOn} />
                    <InfoRow
                      label="Login attempts"
                      value={String(user.loginAttempts)}
                    />
                  </dl>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles strokeWidth={1.5} />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck strokeWidth={1.5} />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard strokeWidth={1.5} />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell strokeWidth={1.5} />
                Notifications
              </DropdownMenuItem>
              <ThemeMenuSub />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut strokeWidth={1.5} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/**
 * One label/value pair in the menu's info block. Side by side — unlike the
 * profile panel's stacked rows — because the menu is wider than that pane and
 * the values here are short enough to sit opposite their label.
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground">{value}</dd>
    </div>
  )
}
