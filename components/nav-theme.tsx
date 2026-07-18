"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"

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

/**
 * Theme picker as a dropdown submenu, meant to nest inside the user menu
 * ({@link NavUser}). The active theme lives in localStorage — unknown to the
 * server — so nothing is marked selected until hydrated, keeping the checkmark
 * out of the SSR markup.
 */
export function ThemeMenuSub() {
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Sun strokeWidth={2} />
        Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={hydrated ? theme : undefined}
          onValueChange={(value) => setTheme(String(value))}
        >
          {themes.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon strokeWidth={2} />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
