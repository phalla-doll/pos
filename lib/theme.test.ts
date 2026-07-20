import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

import {
  brightnessOf,
  checkedOption,
  composeTheme,
  defaultTheme,
  isTheme,
  menuTheme,
  paletteOf,
  themeOptionValues,
  themeOptions,
  themes,
  toggleLightDark,
  type Theme,
  type ThemeOption,
} from "@/lib/theme"

describe("the theme matrix", () => {
  it("covers both palettes at both brightnesses", () => {
    expect(themes).toEqual(["light", "dark", "system", "system-dark"])
  })

  it("round-trips every theme through its two axes", () => {
    for (const theme of themes) {
      expect(composeTheme(paletteOf(theme), brightnessOf(theme))).toBe(theme)
    }
  })

  it("defaults to a palette it knows", () => {
    expect(isTheme(defaultTheme)).toBe(true)
  })
})

describe("isTheme", () => {
  const cases: [string | undefined | null, boolean][] = [
    ["light", true],
    ["dark", true],
    ["system", true],
    ["system-dark", true],
    ["blue", false],
    ["", false],
    [undefined, false],
    [null, false],
    ["toString", false],
  ]

  it.each(cases)("%s → %s", (value, expected) => {
    expect(isTheme(value)).toBe(expected)
  })
})

describe("menuTheme", () => {
  // Picking System keeps the brightness the user was already on — the point
  // of encoding both axes in one value.
  const cases: [ThemeOption, string | undefined, Theme][] = [
    ["system", "light", "system"],
    ["system", "dark", "system-dark"],
    ["system", "system", "system"],
    ["system", "system-dark", "system-dark"],
    ["system", undefined, "system"],
    // Light and Dark pin the brightness and drop back to neutral.
    ["light", "system-dark", "light"],
    ["dark", "system", "dark"],
    ["light", "dark", "light"],
    ["dark", "light", "dark"],
  ]

  it.each(cases)("%s from %s → %s", (option, current, expected) => {
    expect(menuTheme(option, current)).toBe(expected)
  })

  it("only ever produces a known theme", () => {
    for (const option of themeOptionValues) {
      for (const current of [...themes, undefined]) {
        expect(isTheme(menuTheme(option, current))).toBe(true)
      }
    }
  })
})

describe("checkedOption", () => {
  const cases: [string | undefined, ThemeOption][] = [
    ["light", "light"],
    ["dark", "dark"],
    ["system", "system"],
    // No entry of its own: it is System, seen at night.
    ["system-dark", "system"],
    [undefined, "light"],
  ]

  it.each(cases)("%s → %s", (theme, expected) => {
    expect(checkedOption(theme)).toBe(expected)
  })

  it("agrees with menuTheme, so the checkmark never lies", () => {
    for (const option of themeOptionValues) {
      for (const current of themes) {
        expect(checkedOption(menuTheme(option, current))).toBe(option)
      }
    }
  })

  it("labels every entry it can return", () => {
    for (const option of themeOptionValues) {
      expect(themeOptions[option].label).toBeTruthy()
    }
  })
})

describe("toggleLightDark", () => {
  const cases: [string | undefined, Theme][] = [
    ["light", "dark"],
    ["dark", "light"],
    // Takes no interest in the palette: flips brightness, lands on neutral.
    ["system", "dark"],
    ["system-dark", "light"],
    [undefined, "dark"],
  ]

  it.each(cases)("%s → %s", (from, expected) => {
    expect(toggleLightDark(from)).toBe(expected)
  })

  it("always flips the brightness and always lands on neutral", () => {
    for (const theme of themes) {
      expect(brightnessOf(toggleLightDark(theme))).not.toBe(brightnessOf(theme))
      expect(paletteOf(toggleLightDark(theme))).toBe("neutral")
    }
  })
})

/**
 * The theme values double as the classes `next-themes` writes onto `<html>`,
 * so a value without a matching CSS block would switch to a theme that does
 * not exist. `light` is the bare `:root` default and has no class of its own.
 */
describe("globals.css", () => {
  const css = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8"
  )
  const classThemes = themes.filter((theme) => theme !== "light")

  it("defines a block for every theme that needs a class", () => {
    for (const theme of classThemes) {
      expect(css).toMatch(new RegExp(`^\\.${theme}[,\\s]`, "m"))
    }
  })

  it("orders the blue overrides after the blocks they override", () => {
    expect(css.indexOf(".system {")).toBeGreaterThan(css.indexOf(":root {"))
    expect(css.indexOf(".system-dark {")).toBeGreaterThan(css.indexOf(".dark,"))
  })

  /**
   * Tailwind's `dark:` utilities key off this variant, so a dark theme missing
   * from it renders dark surfaces with light-mode utility overrides.
   */
  it("routes every dark theme through the dark variant", () => {
    const variant = css.match(/@custom-variant dark \(([^)]*\))\);/)?.[1] ?? ""

    for (const theme of themes.filter((t) => brightnessOf(t) === "dark")) {
      expect(variant).toContain(`.${theme} `)
    }
  })
})
