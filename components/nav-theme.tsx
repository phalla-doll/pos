"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"

import { cn } from "@/lib/utils"
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

const emptySubscribe = () => () => {}

// `true` only after hydration. The selected theme comes from localStorage, which
// the server can't know, so we render nothing-selected until mounted to avoid a
// hydration mismatch (React won't patch up a mismatched attribute otherwise).
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function NavTheme() {
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="flex items-center gap-1 rounded-md bg-muted p-1 group-data-[collapsible=icon]:hidden"
        >
          {themes.map(({ value, label, icon: Icon }) => {
            const isActive = hydrated && theme === value
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
                    : "text-muted-foreground hover:text-foreground"
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
