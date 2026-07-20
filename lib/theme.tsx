import { Sun, Moon, Monitor } from "lucide-react"
import type { LucideIcon } from "lucide-react"

/**
 * A theme is two independent choices — a palette and a brightness — collapsed
 * into the one string `next-themes` can store:
 *
 *     neutral + light  →  "light"          (bare `:root`)
 *     neutral + dark   →  "dark"           (`.dark`)
 *     blue    + light  →  "system"         (`.system`)
 *     blue    + dark   →  "system-dark"    (`.system-dark`)
 *
 * Encoding both axes in the stored value is what lets "System" adapt: the
 * brightness the user was already on is right there to read, so switching
 * palettes preserves it without a second storage key or a second
 * pre-hydration script. None of the four consults `prefers-color-scheme` —
 * "System" keeps its name for familiarity but selects the blue palette.
 *
 * The four values are also the classes `next-themes` puts on `<html>` (bar
 * `light`, the bare default), so these and the blocks in `app/globals.css` are
 * one list stated once. `theme.test.ts` pins the pairing.
 */
const themeMatrix = {
  neutral: { light: "light", dark: "dark" },
  blue: { light: "system", dark: "system-dark" },
} as const

export type Palette = keyof typeof themeMatrix
export type Brightness = keyof (typeof themeMatrix)[Palette]
export type Theme = (typeof themeMatrix)[Palette][Brightness]

export function composeTheme(palette: Palette, brightness: Brightness): Theme {
  return themeMatrix[palette][brightness]
}

export const themes: Theme[] = Object.values(themeMatrix).flatMap((row) =>
  Object.values(row)
)

export const defaultTheme: Theme = composeTheme("neutral", "light")

export function isTheme(value: string | undefined | null): value is Theme {
  return value != null && (themes as string[]).includes(value)
}

export function paletteOf(theme: string | undefined): Palette {
  return theme === "system" || theme === "system-dark" ? "blue" : "neutral"
}

export function brightnessOf(theme: string | undefined): Brightness {
  return theme === "dark" || theme === "system-dark" ? "dark" : "light"
}

/**
 * The picker's three entries. Selecting one sets a palette; the brightness
 * comes from wherever the user already was, which is the whole point of the
 * split. Light and Dark additionally pin the brightness, so they are the only
 * way to change it from the menu — `menuTheme` is what reconciles the two.
 */
export const themeOptions = {
  light: { label: "Light", icon: Sun },
  dark: { label: "Dark", icon: Moon },
  system: { label: "System", icon: Monitor },
} as const satisfies Record<string, { label: string; icon: LucideIcon }>

export type ThemeOption = keyof typeof themeOptions

export const themeOptionValues = Object.keys(themeOptions) as ThemeOption[]

/** The theme a menu selection produces, given where the user is now. */
export function menuTheme(option: ThemeOption, current: string | undefined) {
  return option === "system"
    ? composeTheme("blue", brightnessOf(current))
    : composeTheme("neutral", option)
}

/**
 * Which menu entry reads as selected. `system-dark` has no entry of its own —
 * it is the System entry seen at night — so it checks System.
 */
export function checkedOption(theme: string | undefined): ThemeOption {
  return paletteOf(theme) === "blue" ? "system" : brightnessOf(theme)
}

/**
 * Where the `d` hotkey goes from here. It is a plain light/dark toggle and
 * takes no interest in the palette: whatever you are on, it flips the
 * brightness and lands you on neutral. So from either blue theme it drops you
 * out of blue rather than switching to the other blue — one key, one meaning,
 * and the palette is the menu's business.
 *
 * `system-dark` is still reachable: pick Dark, then System, which carries the
 * brightness across (see {@link menuTheme}).
 *
 * Note this reads `theme`, never `resolvedTheme`. `next-themes` computes
 * `resolvedTheme` as `theme === "system" ? systemTheme : theme` *without*
 * gating on `enableSystem`, so on the blue palette it reports the OS's
 * light/dark preference — exactly the signal this app no longer honours.
 */
export function toggleLightDark(theme: string | undefined): Theme {
  return composeTheme(
    "neutral",
    brightnessOf(theme) === "dark" ? "light" : "dark"
  )
}
