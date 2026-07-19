import { describe, expect, it } from "vitest"

import {
  defaultPageSize,
  pageSizes,
  pageSlice,
  pageWindow,
  paginate,
  rescalePage,
  windowSize,
  type PageSlot,
} from "@/lib/list-pagination"

describe("paginate", () => {
  const cases: [string, [number, number, number], [number, number, number]][] =
    [
      // label, [total, page, size], [expected page, from, to]
      ["first page of many", [137, 1, 25], [1, 1, 25]],
      ["a middle page", [137, 3, 25], [3, 51, 75]],
      ["a short last page", [137, 6, 25], [6, 126, 137]],
      ["an exactly-full last page", [100, 4, 25], [4, 76, 100]],
      ["fewer rows than one page", [12, 1, 25], [1, 1, 12]],
      ["a page past the end is clamped", [137, 99, 25], [6, 126, 137]],
      ["a page below one is clamped", [137, 0, 25], [1, 1, 25]],
      ["a negative page is clamped", [137, -4, 25], [1, 1, 25]],
      ["an empty list still has a page 1", [0, 1, 25], [1, 0, 0]],
    ]

  it.each(cases)("%s", (_label, [total, page, size], [expected, from, to]) => {
    const result = paginate(total, page, size)
    expect(result.page).toBe(expected)
    expect(result.from).toBe(from)
    expect(result.to).toBe(to)
  })

  it("counts pages, never below one", () => {
    expect(paginate(137, 1, 25).pageCount).toBe(6)
    expect(paginate(100, 1, 25).pageCount).toBe(4)
    expect(paginate(0, 1, 25).pageCount).toBe(1)
  })

  it("clamps `end` to the row count rather than the page boundary", () => {
    expect(paginate(137, 6, 25)).toMatchObject({ start: 125, end: 137 })
  })

  it("survives a nonsense page size", () => {
    expect(paginate(10, 1, 0)).toMatchObject({
      pageCount: 10,
      start: 0,
      end: 1,
    })
  })
})

describe("pageSlice", () => {
  const rows = Array.from({ length: 10 }, (_, index) => index)

  it("returns the rows the page covers", () => {
    expect(pageSlice(rows, paginate(rows.length, 2, 4))).toEqual([4, 5, 6, 7])
  })

  it("returns a short final page rather than padding it", () => {
    expect(pageSlice(rows, paginate(rows.length, 3, 4))).toEqual([8, 9])
  })

  it("returns nothing for an empty list", () => {
    expect(pageSlice([], paginate(0, 1, 25))).toEqual([])
  })
})

describe("rescalePage", () => {
  const cases: [string, [number, number, number], number][] = [
    // label, [page, oldSize, newSize], expected page
    ["keeps page 1 as page 1", [1, 25, 50], 1],
    ["a bigger page absorbs two old ones", [3, 25, 50], 2],
    ["a smaller page splits one into two", [2, 50, 25], 3],
    ["the top row stays on screen", [4, 10, 25], 2],
    ["never lands below page 1", [0, 25, 10], 1],
  ]

  it.each(cases)("%s", (_label, [page, oldSize, newSize], expected) => {
    expect(rescalePage(page, oldSize, newSize)).toBe(expected)
  })
})

describe("pageWindow", () => {
  const cases: [string, [number, number], PageSlot[]][] = [
    // label, [page, pageCount], expected slots
    ["a single page", [1, 1], [1]],
    ["every page when they fit", [3, 5], [1, 2, 3, 4, 5]],
    ["exactly the window size", [4, 7], [1, 2, 3, 4, 5, 6, 7]],
    [
      "near the start, one gap on the right",
      [2, 20],
      [1, 2, 3, 4, 5, "gap", 20],
    ],
    ["the edge of the leading run", [4, 20], [1, 2, 3, 4, 5, "gap", 20]],
    [
      "in the middle, a gap on both sides",
      [10, 20],
      [1, "gap", 9, 10, 11, "gap", 20],
    ],
    ["the edge of the trailing run", [17, 20], [1, "gap", 16, 17, 18, 19, 20]],
    [
      "near the end, one gap on the left",
      [20, 20],
      [1, "gap", 16, 17, 18, 19, 20],
    ],
    [
      "a page past the end is clamped",
      [99, 20],
      [1, "gap", 16, 17, 18, 19, 20],
    ],
  ]

  it.each(cases)("%s", (_label, [page, pageCount], expected) => {
    expect(pageWindow(page, pageCount)).toEqual(expected)
  })

  it("never renders more than the window size, so the pager keeps its width", () => {
    for (let page = 1; page <= 40; page++) {
      expect(pageWindow(page, 40).length).toBeLessThanOrEqual(windowSize)
    }
  })

  it("always offers the first and last page as a way out", () => {
    for (let page = 1; page <= 40; page++) {
      const slots = pageWindow(page, 40)
      expect(slots[0]).toBe(1)
      expect(slots[slots.length - 1]).toBe(40)
    }
  })

  it("never repeats a page number", () => {
    for (let page = 1; page <= 40; page++) {
      const numbers = pageWindow(page, 40).filter(
        (slot): slot is number => slot !== "gap"
      )
      expect(new Set(numbers).size).toBe(numbers.length)
    }
  })

  it("keeps the current page in the window", () => {
    for (let page = 1; page <= 40; page++) {
      expect(pageWindow(page, 40)).toContain(page)
    }
  })

  it("only elides a run worth eliding — a gap always skips 2+ pages", () => {
    for (let page = 1; page <= 40; page++) {
      const slots = pageWindow(page, 40)
      slots.forEach((slot, index) => {
        if (slot !== "gap") return
        const before = slots[index - 1] as number
        const after = slots[index + 1] as number
        expect(after - before).toBeGreaterThan(2)
      })
    }
  })
})

describe("page size options", () => {
  it("offers the default as one of the choices", () => {
    expect(pageSizes).toContain(defaultPageSize)
  })

  it("lists sizes in ascending order", () => {
    expect([...pageSizes]).toEqual([...pageSizes].sort((a, b) => a - b))
  })
})
