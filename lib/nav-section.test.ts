import { describe, expect, it } from "vitest"

import type { NavEntry } from "@/lib/nav"
import type { ScreenType } from "@/lib/screens"
import {
  defaultSectionLabel,
  findTopLevelGroup,
  firstGroupLabel,
  groupAtPath,
  topLevelGroups,
} from "@/lib/nav-section"

// Minimal tree fixtures — only the fields the helpers read (kind, label,
// children, screen.type). Icons and components are irrelevant here, which is
// the point of injecting the tree rather than importing the real `sidebarNav`.
const leaf = (type: string): NavEntry =>
  ({ kind: "screen", screen: { type } }) as unknown as NavEntry
const group = (label: string, children: NavEntry[]): NavEntry =>
  ({ kind: "group", label, icon: null, children }) as unknown as NavEntry

const t = (type: string) => type as ScreenType

/** A child's identity for assertions: screen type for leaves, label for groups. */
const childKey = (e: NavEntry) =>
  e.kind === "screen" ? e.screen.type : e.label

const tree: NavEntry[] = [
  leaf("dashboard"),
  group("Admin", [
    leaf("users"),
    group("System", [leaf("audit-logs"), group("Deep", [leaf("cache")])]),
  ]),
  group("Reports", [leaf("best-sales")]),
  leaf("settings"),
]

describe("topLevelGroups", () => {
  it("keeps only top-level groups, in order", () => {
    expect(topLevelGroups(tree).map((g) => g.label)).toEqual([
      "Admin",
      "Reports",
    ])
  })

  it("is empty for a tree of only leaves", () => {
    expect(topLevelGroups([leaf("a"), leaf("b")])).toEqual([])
  })
})

describe("firstGroupLabel", () => {
  it("returns the first top-level group's label", () => {
    expect(firstGroupLabel(tree)).toBe("Admin")
  })

  it("is null when there are no groups", () => {
    expect(firstGroupLabel([leaf("a")])).toBeNull()
  })
})

describe("findTopLevelGroup", () => {
  it("finds a group by label", () => {
    expect(findTopLevelGroup(tree, "Reports")?.children).toHaveLength(1)
  })

  it("returns null for an unknown label", () => {
    expect(findTopLevelGroup(tree, "Nope")).toBeNull()
  })

  it("does not match a nested group's label", () => {
    // "System" is a group, but nested — not a top-level section.
    expect(findTopLevelGroup(tree, "System")).toBeNull()
  })
})

describe("groupAtPath", () => {
  it("returns the top-level section at a one-label path", () => {
    expect(groupAtPath(tree, ["Admin"])?.children.map(childKey)).toEqual([
      "users",
      "System",
    ])
  })

  it("drills into a nested group", () => {
    expect(
      groupAtPath(tree, ["Admin", "System"])?.children.map(childKey)
    ).toEqual(["audit-logs", "Deep"])
  })

  it("drills to any depth", () => {
    expect(groupAtPath(tree, ["Admin", "System", "Deep"])?.label).toBe("Deep")
  })

  it("is null for an empty path", () => {
    expect(groupAtPath(tree, [])).toBeNull()
  })

  it("is null when a label matches nothing at its level", () => {
    // "System" is real, but not a *top-level* section.
    expect(groupAtPath(tree, ["System"])).toBeNull()
    // "audit-logs" is a leaf, not a group, so it can't be drilled into.
    expect(groupAtPath(tree, ["Admin", "audit-logs"])).toBeNull()
  })
})

describe("defaultSectionLabel", () => {
  it("maps a direct child to its top-level group", () => {
    expect(defaultSectionLabel(tree, t("users"))).toBe("Admin")
    expect(defaultSectionLabel(tree, t("best-sales"))).toBe("Reports")
  })

  it("maps a deeply nested screen to its top-level group", () => {
    expect(defaultSectionLabel(tree, t("audit-logs"))).toBe("Admin")
    expect(defaultSectionLabel(tree, t("cache"))).toBe("Admin")
  })

  it("is null for a top-level leaf (owned by no group)", () => {
    expect(defaultSectionLabel(tree, t("dashboard"))).toBeNull()
    expect(defaultSectionLabel(tree, t("settings"))).toBeNull()
  })

  it("is null for nothing focused or an unknown screen", () => {
    expect(defaultSectionLabel(tree, null)).toBeNull()
    expect(defaultSectionLabel(tree, t("ghost"))).toBeNull()
  })
})
