import { describe, expect, it } from "vitest"

import {
  collectScreenTypes,
  commandValue,
  findNavIssues,
  flattenNav,
  sidebarNav,
  type NavEntry,
} from "@/lib/nav"
import { screens, type Screen, type ScreenType } from "@/lib/screens"

// Build synthetic nav entries without pulling in real screen objects. The
// consistency helpers only read `screen.type` (and `label`, for the palette),
// so a minimal shape suffices; arbitrary type strings are cast in since these
// fixtures never touch the real registry keys.
function leaf(type: string, label = type.toUpperCase()): NavEntry {
  return { kind: "screen", screen: { type, label } as unknown as Screen }
}
function group(children: NavEntry[], label = "g"): NavEntry {
  return { kind: "group", label, icon: null, children }
}
function types(...t: string[]): ScreenType[] {
  return t as unknown as ScreenType[]
}

describe("findNavIssues (pure)", () => {
  it("reports nothing when every type is reachable exactly once", () => {
    const nav = [leaf("a"), group([leaf("b"), leaf("c")])]
    expect(findNavIssues(types("a", "b", "c"), nav)).toEqual({
      unreachable: [],
      duplicated: [],
    })
  })

  it("reports screens missing from the nav as unreachable", () => {
    const nav = [leaf("a")]
    expect(findNavIssues(types("a", "b", "c"), nav).unreachable).toEqual(
      types("b", "c")
    )
  })

  it("reports a screen listed twice as duplicated", () => {
    const nav = [leaf("a"), group([leaf("a")])]
    expect(findNavIssues(types("a"), nav).duplicated).toEqual(types("a"))
  })

  it("collects nested screen types depth-first in order", () => {
    const nav = [leaf("a"), group([leaf("b"), group([leaf("c")])]), leaf("d")]
    expect(collectScreenTypes(nav)).toEqual(types("a", "b", "c", "d"))
  })
})

describe("flattenNav (pure)", () => {
  it("gives top-level screens an empty breadcrumb", () => {
    expect(flattenNav([leaf("a")])).toEqual([
      { screen: { type: "a", label: "A" }, path: [] },
    ])
  })

  it("carries the group label down to a nested screen", () => {
    const nav = [group([leaf("b")], "Reports")]
    expect(flattenNav(nav)[0].path).toEqual(["Reports"])
  })

  it("accumulates every ancestor label, outermost first", () => {
    const nav = [group([group([leaf("c")], "Financials")], "Reports")]
    expect(flattenNav(nav)[0].path).toEqual(["Reports", "Financials"])
  })

  it("returns leaves depth-first in traversal order, dropping groups", () => {
    const nav = [leaf("a"), group([leaf("b"), group([leaf("c")])]), leaf("d")]
    expect(flattenNav(nav).map((c) => c.screen.type)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ])
  })

  it("does not leak a sibling's breadcrumb into a later entry", () => {
    const nav = [group([leaf("a")], "Reports"), leaf("b")]
    expect(flattenNav(nav).map((c) => c.path)).toEqual([["Reports"], []])
  })
})

describe("commandValue (pure)", () => {
  it("matches on the label alone for a top-level screen", () => {
    expect(
      commandValue({ screen: { label: "Inventory" } as Screen, path: [] })
    ).toBe("Inventory")
  })

  it("appends the breadcrumb so a group name finds its screens", () => {
    const value = commandValue({
      screen: { label: "Tax Report" } as Screen,
      path: ["Reports", "Financials"],
    })
    expect(value).toBe("Tax Report Reports Financials")
  })
})

describe("real registry ↔ sidebar nav", () => {
  it("lists every screen exactly once, with no dangling entries", () => {
    const allTypes = Object.keys(screens) as ScreenType[]
    expect(findNavIssues(allTypes, sidebarNav)).toEqual({
      unreachable: [],
      duplicated: [],
    })
  })

  it("exposes every screen to the palette, with real breadcrumbs", () => {
    const commands = flattenNav(sidebarNav)
    expect(commands).toHaveLength(Object.keys(screens).length)

    const tax = commands.find((c) => c.screen.type === "tax-report")
    expect(tax?.path).toEqual(["Reports", "Financials"])
    expect(commandValue(tax!)).toBe("Tax Report Reports Financials")

    expect(commands.find((c) => c.screen.type === "dashboard")?.path).toEqual(
      []
    )
  })

  it("carries a full breadcrumb for the 4-level branches", () => {
    const commands = flattenNav(sidebarNav)

    expect(
      commands.find((c) => c.screen.type === "balance-sheet")?.path
    ).toEqual(["Reports", "Financials", "Statements"])
    expect(
      commands.find((c) => c.screen.type === "scheduled-jobs")?.path
    ).toEqual(["Admin Tools", "System", "Maintenance"])
  })
})
