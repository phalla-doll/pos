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

  /**
   * Every top-level rule in the file, as `[, selector, declarations]`. Comments
   * are stripped first: one of them contains `{false}`, which would otherwise
   * end `:root`'s body early and hide half the palette from these checks.
   * Nested rules are skipped by the leading `[.:[]` — a declaration is indented
   * and an at-rule starts with `@`.
   */
  const rules = [
    ...css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .matchAll(/^([.:[][^{}]*)\{([^{}]*)\}/gm),
  ]

  /**
   * The focus edge is mixed from one accent, and a theme that answers nothing
   * for it doesn't degrade: an empty value mixes an empty accent, so the ring
   * loses its colour outright rather than falling back to something duller.
   *
   * The neutral palettes have no accent to derive it from and carry the blue
   * outright; the blue ones point it at their own.
   */
  it("answers --toolbar-accent from every theme", () => {
    for (const theme of themes) {
      const applies = (selector: string) =>
        selector.includes(":root") ||
        new RegExp(`\\.${theme}(?![\\w-])`).test(selector)

      expect(
        rules.some(
          ([, selector, body]) =>
            applies(selector) && body.includes("--toolbar-accent:")
        )
      ).toBe(true)
    }
  })

  /**
   * The focus edge is an accent, so a palette that moves the accent has to move
   * it too — left inherited, the blue themes answered a focused input with the
   * neutral grey, and it is the one cue that exists to be noticed.
   *
   * Each block restating its own ring is what that used to mean, and a block
   * forgetting to is what it could not catch. So the edge is mixed from
   * `--toolbar-accent` instead — a token the test above already pins every
   * theme to answering — and the invariant becomes the stronger one: exactly
   * one declaration, in `:root`, derived rather than written out. A theme
   * cannot then be added with a grey ring, because it cannot be added with a
   * ring of its own at all.
   *
   * Both are checked. `--sidebar-ring` is a separate variable mixed towards a
   * separate surface, so a blue app could otherwise focus its inputs blue and
   * its sidebar grey.
   */
  it.each([
    ["--ring", /(?<![\w-])--ring:\s*([^;]*)/],
    ["--sidebar-ring", /(?<![\w-])--sidebar-ring:\s*([^;]*)/],
  ])("derives %s from the accent, in one place", (_token, pattern) => {
    const declarations = rules.filter(([, , body]) => pattern.test(body))

    expect(declarations).toHaveLength(1)
    const [[, selector, body]] = declarations
    expect(selector).toContain(":root")
    expect(body.match(pattern)?.[1]).toContain("--toolbar-accent")
  })

  /**
   * ...and then draws it as a border rather than a halo. The rule that turns
   * the halo off zeroes a variable the vendored components set from
   * `@layer utilities`, so it only wins by sitting outside every layer — moved
   * into `@layer base` for tidiness it would lose to all of them silently and
   * every ring would come back. `rules` is built from *top-level* rules alone
   * (a layered one is indented past the `^`), so finding it there is the
   * assertion.
   */
  it("turns off the focus ring from outside the cascade layers", () => {
    expect(
      rules.some(
        ([, selector, body]) =>
          selector.includes(":focus-visible") && /--tw-ring-shadow:/.test(body)
      )
    ).toBe(true)
  })
})
