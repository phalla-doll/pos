import { describe, expect, it } from "vitest"

import {
  compare,
  cycleSort,
  deriveRows,
  matches,
  type ListColumn,
} from "@/lib/list-rows"

type Row = { name: string; qty: number }

const columns: ListColumn<Row>[] = [
  { key: "name", header: "Name", get: (r) => r.name },
  { key: "qty", header: "Qty", get: (r) => r.qty },
]

const rows: Row[] = [
  { name: "Banana", qty: 2 },
  { name: "apple", qty: 10 },
  { name: "Cherry", qty: 2 },
]

describe("matches", () => {
  it("is case-insensitive and trims the query", () => {
    expect(matches(rows[1], columns[0], "  APP ")).toBe(true)
  })

  it("passes everything through for a blank/whitespace query", () => {
    expect(matches(rows[0], columns[0], "   ")).toBe(true)
  })

  it("coerces numeric values to strings before matching", () => {
    expect(matches(rows[1], columns[1], "10")).toBe(true)
    expect(matches(rows[0], columns[1], "10")).toBe(false)
  })
})

describe("compare", () => {
  it("orders numbers numerically", () => {
    expect(compare(2, 10)).toBeLessThan(0)
  })

  it("orders strings numeric-aware (so '10' follows '2')", () => {
    expect(compare("item2", "item10")).toBeLessThan(0)
  })
})

describe("deriveRows", () => {
  it("returns the original rows when no filter is applied", () => {
    expect(deriveRows(rows, columns, {}, null)).toBe(rows)
  })

  it("filters by every active column (AND semantics)", () => {
    const out = deriveRows(rows, columns, { name: "a", qty: "2" }, null)
    expect(out.map((r) => r.name)).toEqual(["Banana"])
  })

  it("ignores whitespace-only filter values", () => {
    expect(deriveRows(rows, columns, { name: "   " }, null)).toBe(rows)
  })

  it("sorts ascending without mutating the input", () => {
    const out = deriveRows(rows, columns, {}, { key: "qty", dir: "asc" })
    expect(out.map((r) => r.qty)).toEqual([2, 2, 10])
    expect(rows.map((r) => r.qty)).toEqual([2, 10, 2]) // untouched
  })

  it("sorts descending", () => {
    const out = deriveRows(rows, columns, {}, { key: "name", dir: "desc" })
    expect(out.map((r) => r.name)).toEqual(["Cherry", "Banana", "apple"])
  })

  it("filters then sorts, keeping the count equal to the filtered set", () => {
    const out = deriveRows(
      rows,
      columns,
      { qty: "2" },
      { key: "name", dir: "asc" }
    )
    expect(out.map((r) => r.name)).toEqual(["Banana", "Cherry"])
  })

  it("is a no-op sort when the sort key is unknown", () => {
    const out = deriveRows(rows, columns, {}, { key: "gone", dir: "asc" })
    expect(out).toBe(rows)
  })

  it("returns the original rows when the global query is blank", () => {
    expect(deriveRows(rows, columns, {}, null, "   ")).toBe(rows)
  })

  it("matches the global query against any filterable column", () => {
    const out = deriveRows(rows, columns, {}, null, "10")
    expect(out.map((r) => r.name)).toEqual(["apple"]) // matched on qty
  })

  it("ANDs the global query with per-column filters", () => {
    const out = deriveRows(rows, columns, { qty: "2" }, null, "cher")
    expect(out.map((r) => r.name)).toEqual(["Cherry"])
  })
})

describe("cycleSort", () => {
  it("goes unsorted → asc for a new column", () => {
    expect(cycleSort(null, "name")).toEqual({ key: "name", dir: "asc" })
  })

  it("goes asc → desc on the same column", () => {
    expect(cycleSort({ key: "name", dir: "asc" }, "name")).toEqual({
      key: "name",
      dir: "desc",
    })
  })

  it("goes desc → unsorted on the same column", () => {
    expect(cycleSort({ key: "name", dir: "desc" }, "name")).toBeNull()
  })

  it("restarts at asc when switching to a different column", () => {
    expect(cycleSort({ key: "name", dir: "desc" }, "qty")).toEqual({
      key: "qty",
      dir: "asc",
    })
  })
})
