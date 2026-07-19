import { describe, expect, it } from "vitest"

import { partitionTabs, type ChipWidths } from "@/lib/tab-overflow"
import type { Tab } from "@/lib/tab-identity"

// Screen types are cast because the partitioner never inspects them — it only
// uses them to look up a measured width. Single-letter types keep the width
// tables readable as data.
type ScreenType = Tab["screenType"]

function tabs(spec: string): Tab[] {
  return spec
    .split(" ")
    .filter(Boolean)
    .map((screenType, i) => ({
      id: `t${i + 1}`,
      screenType: screenType as ScreenType,
    }))
}

/** Every chip 100px wide unless the case says otherwise. */
const uniform: ChipWidths = { a: 100, b: 100, c: 100, d: 100, e: 100 }

/** Defaults sized so the arithmetic in each case stays in view. */
function partition(
  spec: string,
  {
    activeId = "t1",
    containerWidth,
    widths = uniform,
    moreWidth = 60,
    gap = 10,
  }: {
    activeId?: string | null
    containerWidth: number
    widths?: ChipWidths
    moreWidth?: number
    gap?: number
  }
) {
  const result = partitionTabs({
    tabs: tabs(spec),
    widths,
    activeId,
    containerWidth,
    moreWidth,
    gap,
  })
  return {
    visible: result.visible.map((t) => t.id),
    overflow: result.overflow.map((t) => t.id),
  }
}

describe("fitting", () => {
  it("keeps every tab visible when the run fits exactly", () => {
    // 3 × 100 + 2 gaps of 10 = 320.
    expect(partition("a b c", { containerWidth: 320 })).toEqual({
      visible: ["t1", "t2", "t3"],
      overflow: [],
    })
  })

  it("overflows the tail once one pixel short", () => {
    // Budget = 319 − 60 (More) − 10 (its gap) = 249, so two chips (210) fit.
    expect(partition("a b c", { containerWidth: 319 })).toEqual({
      visible: ["t1", "t2"],
      overflow: ["t3"],
    })
  })

  it("handles an empty workspace", () => {
    expect(partition("", { containerWidth: 500 })).toEqual({
      visible: [],
      overflow: [],
    })
  })
})

describe("unmeasured passes render everything", () => {
  it("returns all visible before the container is measured", () => {
    expect(partition("a b c", { containerWidth: 0 })).toEqual({
      visible: ["t1", "t2", "t3"],
      overflow: [],
    })
  })

  it("returns all visible while any screen type lacks a width", () => {
    // `c` has just been opened and hasn't been through a layout pass yet.
    expect(
      partition("a b c", {
        containerWidth: 150,
        widths: { a: 100, b: 100 },
      })
    ).toEqual({ visible: ["t1", "t2", "t3"], overflow: [] })
  })
})

describe("the active tab is always visible", () => {
  it("pins an active tab that the left-to-right fill would have dropped", () => {
    // Budget 249. Reserve t4 (100), then t1 fits (100) but t2 needs 110 more.
    expect(
      partition("a b c d", { containerWidth: 319, activeId: "t4" })
    ).toEqual({ visible: ["t1", "t4"], overflow: ["t2", "t3"] })
  })

  it("keeps a pinned tab in document order rather than moving it to the end", () => {
    expect(
      partition("a b c d e", { containerWidth: 319, activeId: "t3" })
    ).toEqual({ visible: ["t1", "t3"], overflow: ["t2", "t4", "t5"] })
  })

  it("shows the active tab even when it alone exceeds the budget", () => {
    expect(partition("a b c", { containerWidth: 90, activeId: "t2" })).toEqual({
      visible: ["t2"],
      overflow: ["t1", "t3"],
    })
  })

  it("falls back to a plain fill when nothing is active", () => {
    expect(
      partition("a b c d", { containerWidth: 319, activeId: null })
    ).toEqual({ visible: ["t1", "t2"], overflow: ["t3", "t4"] })
  })

  it("ignores an activeId that names no open tab", () => {
    expect(
      partition("a b c d", { containerWidth: 319, activeId: "gone" })
    ).toEqual({ visible: ["t1", "t2"], overflow: ["t3", "t4"] })
  })
})

describe("width lookup is by screen type", () => {
  it("charges duplicates of one type the same width", () => {
    // Three `a` chips at 60 + 2 gaps = 200 > 199, so the budget is 199 − 60 = 139,
    // which holds exactly two (60 + 10 + 60 = 130).
    expect(
      partition("a a a", {
        containerWidth: 199,
        widths: { a: 60 },
        moreWidth: 50,
      })
    ).toEqual({ visible: ["t1", "t2"], overflow: ["t3"] })
  })

  it("uses per-type widths when they differ", () => {
    // Budget 249: reserve nothing, take a (200), then b (10 + 40) = 250 > 249.
    expect(
      partition("a b c", {
        containerWidth: 319,
        widths: { a: 200, b: 40, c: 200 },
      })
    ).toEqual({ visible: ["t1"], overflow: ["t2", "t3"] })
  })
})

describe("the fill stops rather than skipping ahead", () => {
  it("does not pull a narrow later tab past a wide one that did not fit", () => {
    // Budget 249: a (200) fits; b (200) does not; c (20) would, but the run ends.
    expect(
      partition("a b c", {
        containerWidth: 319,
        activeId: null,
        widths: { a: 200, b: 200, c: 20 },
      })
    ).toEqual({ visible: ["t1"], overflow: ["t2", "t3"] })
  })
})
