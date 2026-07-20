"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Sun } from "lucide-react"

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  checkedOption,
  menuTheme,
  themeOptionValues,
  themeOptions,
  type ThemeOption,
} from "@/lib/theme"

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
 *
 * The menu shows palettes, not themes: a theme also carries a brightness, and
 * `system-dark` checks the same System entry as `system`. `menuTheme` and
 * `checkedOption` are the two halves of that projection, so picking System
 * keeps whichever brightness the user was already on.
 */
export function ThemeMenuSub() {
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Sun strokeWidth={1.5} />
        Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={hydrated ? checkedOption(theme) : undefined}
          onValueChange={(value) =>
            setTheme(menuTheme(String(value) as ThemeOption, theme))
          }
        >
          {themeOptionValues.map((option) => {
            const { label, icon: Icon } = themeOptions[option]

            return (
              <DropdownMenuRadioItem key={option} value={option}>
                <Icon strokeWidth={1.5} />
                {label}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
