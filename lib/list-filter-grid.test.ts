import { describe, expect, it } from "vitest"

import {
  columnDepth,
  conditionGroups,
  conditionsPerColumn,
  maxConditionColumns,
} from "@/lib/list-filter-grid"

/** Conditions stand in as their index, so a group reads as what it holds. */
const fields = (count: number) => Array.from({ length: count }, (_, i) => i)

describe("columnDepth", () => {
  const cases: [string, number, number][] = [
    // label, condition count, expected depth
    ["nothing to lay out", 0, 4],
    ["under one column", 3, 4],
    ["exactly the tracks' capacity", 12, 4],
    ["one past capacity, columns deepen", 13, 5],
    ["far past capacity", 30, 10],
  ]

  it.each(cases)("%s", (_label, count, expected) => {
    expect(columnDepth(count)).toBe(expected)
  })

  it("never runs shallower than a full column", () => {
    for (let count = 0; count <= 60; count++) {
      expect(columnDepth(count)).toBeGreaterThanOrEqual(conditionsPerColumn)
    }
  })
})

describe("conditionGroups", () => {
  const cases: [string, number, number[]][] = [
    // label, condition count, expected group sizes
    ["nothing to group", 0, []],
    ["a single condition", 1, [1]],
    ["one column, exactly filled", 4, [4]],
    ["one over starts a second column", 5, [4, 1]],
    // The screens this exists for. Both leave the third track empty at `xl`,
    // which is the point: the columns fill in order rather than spreading.
    ["customers", 6, [4, 2]],
    ["inventory", 7, [4, 3]],
    ["two columns, exactly filled", 8, [4, 4]],
    ["one over starts a third", 9, [4, 4, 1]],
    ["three columns, exactly filled", 12, [4, 4, 4]],
    ["past capacity, the columns deepen instead", 13, [5, 5, 3]],
    ["far past capacity", 30, [10, 10, 10]],
  ]

  it.each(cases)("%s", (_label, count, sizes) => {
    expect(conditionGroups(fields(count)).map((g) => g.length)).toEqual(sizes)
  })

  it("fills each column before starting the next", () => {
    for (let count = 1; count <= 60; count++) {
      const groups = conditionGroups(fields(count))
      const depth = columnDepth(count)
      // Every group but the last is full…
      for (const group of groups.slice(0, -1)) {
        expect(group.length).toBe(depth)
      }
      // …and the last holds whatever remains.
      expect(groups.at(-1)?.length).toBeGreaterThan(0)
    }
  })

  it("never needs more columns than there are tracks", () => {
    for (let count = 0; count <= 60; count++) {
      expect(conditionGroups(fields(count)).length).toBeLessThanOrEqual(
        maxConditionColumns
      )
    }
  })

  it("keeps every condition, in order", () => {
    for (let count = 0; count <= 20; count++) {
      expect(conditionGroups(fields(count)).flat()).toEqual(fields(count))
    }
  })
})
