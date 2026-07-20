"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

import { defaultTheme, themes, toggleBrightness } from "@/lib/theme"

/**
 * `enableSystem={false}` is what makes the palettes peers. With it off,
 * `next-themes` stops special-casing the `system` value — both the runtime
 * `applyTheme` and the pre-hydration inline script gate their
 * `prefers-color-scheme` lookup on this flag — so `system` is applied as a
 * plain `.system` class like any other. The OS preference is never consulted.
 *
 * `enableColorScheme={false}` for a related reason: it only recognises the
 * literal values `light`/`dark`, so `system-dark` would fall through to the
 * default and pair light form controls with a dark surface. `globals.css`
 * declares `color-scheme` per block instead.
 */
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      themes={themes}
      defaultTheme={defaultTheme}
      enableSystem={false}
      enableColorScheme={false}
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(toggleBrightness(theme))
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [theme, setTheme])

  return null
}

export { ThemeProvider }
