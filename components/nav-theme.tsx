"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

export function NavTheme() {
  const { theme, setTheme } = useTheme()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="flex items-center gap-1 rounded-md bg-muted p-1 group-data-[collapsible=icon]:hidden"
        >
          {themes.map(({ value, label, icon: Icon }) => {
            const isActive = theme === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={label}
                title={label}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex h-7 flex-1 items-center justify-center gap-1.5 rounded-sm text-xs font-medium ring-sidebar-ring outline-hidden transition-colors focus-visible:ring-2",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon strokeWidth={2} className="size-3.5" />
                {label}
              </button>
            )
          })}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
