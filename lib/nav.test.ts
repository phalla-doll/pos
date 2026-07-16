import { describe, expect, it } from "vitest"

import {
  collectScreenTypes,
  findNavIssues,
  sidebarNav,
  type NavEntry,
} from "@/lib/nav"
import { screens, type Screen, type ScreenType } from "@/lib/screens"

// Build synthetic nav entries without pulling in real screen objects. The
// consistency helpers only read `screen.type`, so a minimal shape suffices;
// arbitrary type strings are cast in since these fixtures never touch the
// real registry keys.
function leaf(type: string): NavEntry {
  return { kind: "screen", screen: { type } as unknown as Screen }
}
function group(children: NavEntry[]): NavEntry {
  return { kind: "group", label: "g", icon: null, children }
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

describe("real registry ↔ sidebar nav", () => {
  it("lists every screen exactly once, with no dangling entries", () => {
    const allTypes = Object.keys(screens) as ScreenType[]
    expect(findNavIssues(allTypes, sidebarNav)).toEqual({
      unreachable: [],
      duplicated: [],
    })
  })
})
