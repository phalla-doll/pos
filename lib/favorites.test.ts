import { describe, expect, it } from "vitest"

import {
  favoriteSections,
  parseFavorites,
  serializeFavorites,
  toggleFavorite,
} from "@/lib/favorites"
import type { NavEntry } from "@/lib/nav"
import type { Screen, ScreenType } from "@/lib/screens"

// Synthetic nav entries, matching the approach in nav.test.ts: the favorites
// helpers only read `screen.type`, so a minimal shape suffices and arbitrary
// type strings are cast in.
function leaf(type: string): NavEntry {
  return { kind: "screen", screen: { type } as unknown as Screen }
}
function group(label: string, children: NavEntry[]): NavEntry {
  return { kind: "group", label, icon: null, children }
}
function types(...t: string[]): ScreenType[] {
  return t as unknown as ScreenType[]
}

describe("parseFavorites (pure)", () => {
  const valid = types("a", "b", "c")

  it("keeps only the valid types, in order", () => {
    expect(parseFavorites("a,b", valid)).toEqual(types("a", "b"))
  })

  it("drops unknown tokens", () => {
    expect(parseFavorites("a,zzz,b", valid)).toEqual(types("a", "b"))
  })

  it("drops duplicates, keeping the first", () => {
    expect(parseFavorites("a,a,b,a", valid)).toEqual(types("a", "b"))
  })

  it("trims whitespace around tokens", () => {
    expect(parseFavorites(" a , b ", valid)).toEqual(types("a", "b"))
  })

  it("reads an empty or junk string as no favorites", () => {
    expect(parseFavorites("", valid)).toEqual([])
    expect(parseFavorites("   ", valid)).toEqual([])
    expect(parseFavorites("zzz,qqq", valid)).toEqual([])
  })

  it("round-trips through serializeFavorites", () => {
    const favs = types("a", "c")
    expect(parseFavorites(serializeFavorites(favs), valid)).toEqual(favs)
  })
})

describe("toggleFavorite (pure)", () => {
  it("appends a type that is absent", () => {
    expect(toggleFavorite(types("a"), types("b")[0])).toEqual(types("a", "b"))
  })

  it("removes a type that is present", () => {
    expect(toggleFavorite(types("a", "b"), types("a")[0])).toEqual(types("b"))
  })

  it("does not mutate its input", () => {
    const input = types("a")
    toggleFavorite(input, types("b")[0])
    expect(input).toEqual(types("a"))
  })
})

describe("favoriteSections (pure)", () => {
  // dashboard/settings are top-level leaves; the rest sit under sections.
  const nav: NavEntry[] = [
    leaf("dashboard"),
    group("Reports", [leaf("best-sales"), leaf("tax-report")]),
    group("Customers", [leaf("customer-listing")]),
    leaf("settings"),
  ]

  it("returns no sections for an empty favorites set", () => {
    expect(favoriteSections(nav, [])).toEqual([])
  })

  it("groups a favorite under its top-level section label", () => {
    const sections = favoriteSections(nav, types("tax-report"))
    expect(sections).toHaveLength(1)
    expect(sections[0].label).toBe("Reports")
    expect(sections[0].screens.map((s) => s.type)).toEqual(types("tax-report"))
  })

  it("labels a top-level leaf's section null", () => {
    const sections = favoriteSections(nav, types("dashboard"))
    expect(sections).toHaveLength(1)
    expect(sections[0].label).toBeNull()
    expect(sections[0].screens.map((s) => s.type)).toEqual(types("dashboard"))
  })

  it("merges scattered top-level leaves into one null section", () => {
    // dashboard leads the tree and settings trails it, yet both are ungrouped.
    const sections = favoriteSections(nav, types("dashboard", "settings"))
    expect(sections).toHaveLength(1)
    expect(sections[0].label).toBeNull()
    expect(sections[0].screens.map((s) => s.type)).toEqual(
      types("dashboard", "settings")
    )
  })

  it("orders sections and screens by the nav's own order", () => {
    const sections = favoriteSections(
      nav,
      // Marked in a jumbled order — display order should ignore it.
      types("tax-report", "settings", "best-sales", "dashboard")
    )
    expect(sections.map((s) => s.label)).toEqual([null, "Reports"])
    expect(sections.flatMap((s) => s.screens.map((x) => x.type))).toEqual(
      types("dashboard", "settings", "best-sales", "tax-report")
    )
  })

  it("skips a favorited type that is not in the nav", () => {
    expect(favoriteSections(nav, types("ghost"))).toEqual([])
  })
})
