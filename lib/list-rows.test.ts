import { describe, expect, it } from "vitest"

import {
  columnKind,
  compare,
  cycleSort,
  defaultOperator,
  deriveRows,
  hasActiveFilter,
  matches,
  toClipboardText,
  type FilterOperator,
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
  const contains = (value: string) => ({ op: "contains" as const, value })

  it("is case-insensitive and trims the query", () => {
    expect(matches(rows[1], columns[0], contains("  APP "))).toBe(true)
  })

  it("passes everything through for a blank/whitespace query", () => {
    expect(matches(rows[0], columns[0], contains("   "))).toBe(true)
  })

  it("passes everything through when there is no condition at all", () => {
    expect(matches(rows[0], columns[0], undefined)).toBe(true)
  })

  it("coerces numeric values to strings before matching", () => {
    expect(matches(rows[1], columns[1], contains("10"))).toBe(true)
    expect(matches(rows[0], columns[1], contains("10"))).toBe(false)
  })

  // rows[0] = { name: "Banana", qty: 2 }
  const textCases: [FilterOperator, string, boolean][] = [
    ["contains", "nan", true],
    ["notContains", "nan", false],
    ["notContains", "zzz", true],
    ["equals", "banana", true],
    ["equals", "Banan", false],
    ["notEquals", "apple", true],
    ["startsWith", "ban", true],
    ["startsWith", "ana", false],
    ["endsWith", "ana", true],
    ["endsWith", "ban", false],
  ]

  it.each(textCases)("applies %s '%s' to a text column", (op, value, want) => {
    expect(matches(rows[0], columns[0], { op, value })).toBe(want)
  })

  const numberCases: [FilterOperator, string, boolean][] = [
    ["gt", "1", true],
    ["gt", "2", false],
    ["gte", "2", true],
    ["lt", "10", true],
    ["lte", "2", true],
    ["lt", "2", false],
  ]

  it.each(numberCases)(
    "applies %s '%s' to a numeric column",
    (op, value, want) => {
      expect(matches(rows[0], columns[1], { op, value })).toBe(want)
    }
  )

  it("orders numerically rather than lexically", () => {
    // "10" > "9" as text, but rows[1].qty is 10 and must beat 9 as a number.
    expect(matches(rows[1], columns[1], { op: "gt", value: "9" })).toBe(true)
  })

  it("falls back to string ordering when a side is not numeric", () => {
    expect(matches(rows[0], columns[0], { op: "gt", value: "Apple" })).toBe(
      true
    )
  })
})

describe("columnKind / defaultOperator", () => {
  it("reads a column of numbers as numeric and starts it on equals", () => {
    expect(columnKind(columns[1], rows)).toBe("number")
    expect(defaultOperator(columns[1], rows)).toBe("equals")
  })

  it("reads a column of strings as text and starts it on contains", () => {
    expect(columnKind(columns[0], rows)).toBe("text")
    expect(defaultOperator(columns[0], rows)).toBe("contains")
  })

  it("falls back to text when there are no rows to judge by", () => {
    expect(columnKind(columns[1], [])).toBe("text")
  })
})

describe("hasActiveFilter", () => {
  it("ignores blank and whitespace-only values", () => {
    expect(hasActiveFilter({})).toBe(false)
    expect(hasActiveFilter({ name: { op: "contains", value: "  " } })).toBe(
      false
    )
  })

  it("is true once any column has a value", () => {
    expect(hasActiveFilter({ name: { op: "equals", value: "a" } })).toBe(true)
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
    const out = deriveRows(
      rows,
      columns,
      {
        name: { op: "contains", value: "a" },
        qty: { op: "contains", value: "2" },
      },
      null
    )
    expect(out.map((r) => r.name)).toEqual(["Banana"])
  })

  it("ignores whitespace-only filter values", () => {
    expect(
      deriveRows(
        rows,
        columns,
        { name: { op: "contains", value: "   " } },
        null
      )
    ).toBe(rows)
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
      { qty: { op: "contains", value: "2" } },
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
    const out = deriveRows(
      rows,
      columns,
      { qty: { op: "contains", value: "2" } },
      null,
      "cher"
    )
    expect(out.map((r) => r.name)).toEqual(["Cherry"])
  })
})

describe("toClipboardText", () => {
  it("writes one tab-separated line per row, in column order", () => {
    expect(toClipboardText(rows.slice(0, 2), columns)).toBe(
      "Banana\t2\napple\t10"
    )
  })

  it("is empty for no rows", () => {
    expect(toClipboardText([], columns)).toBe("")
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
