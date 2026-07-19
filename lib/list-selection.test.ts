import { describe, expect, it } from "vitest"

import {
  emptySelection,
  selectionSummary,
  toggleAll,
  toggleRow,
  type RowKey,
  type SelectionState,
} from "@/lib/list-selection"

const set = (...keys: RowKey[]): SelectionState => new Set(keys)
const sorted = (s: SelectionState) => [...s].sort()

describe("toggleRow", () => {
  it("adds a row that is not selected", () => {
    expect(sorted(toggleRow(emptySelection, "a"))).toEqual(["a"])
  })

  it("removes a row that is already selected", () => {
    expect(sorted(toggleRow(set("a", "b"), "a"))).toEqual(["b"])
  })

  it("never mutates the incoming set", () => {
    const before = set("a")
    toggleRow(before, "b")
    expect(sorted(before)).toEqual(["a"])
  })
})

describe("selectionSummary", () => {
  const cases: [string, SelectionState, RowKey[], "none" | "some" | "all"][] = [
    ["empty table", set("a"), [], "none"],
    ["nothing ticked", emptySelection, ["a", "b"], "none"],
    ["partly ticked", set("a"), ["a", "b"], "some"],
    ["fully ticked", set("a", "b"), ["a", "b"], "all"],
    ["ignores rows hidden by a filter", set("a", "hidden"), ["a"], "all"],
  ]

  it.each(cases)("reads %s as %s", (_label, selected, visible, expected) => {
    expect(selectionSummary(selected, visible)).toBe(expected)
  })
})

describe("toggleAll", () => {
  it("selects every visible row when only some are ticked", () => {
    expect(sorted(toggleAll(set("a"), ["a", "b"]))).toEqual(["a", "b"])
  })

  it("deselects the visible rows when they are all ticked", () => {
    expect(sorted(toggleAll(set("a", "b"), ["a", "b"]))).toEqual([])
  })

  it("leaves filtered-out selections alone in both directions", () => {
    expect(sorted(toggleAll(set("hidden"), ["a"]))).toEqual(["a", "hidden"])
    expect(sorted(toggleAll(set("a", "hidden"), ["a"]))).toEqual(["hidden"])
  })
})
