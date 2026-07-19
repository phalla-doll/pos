import { describe, expect, it } from "vitest"

import { deletePlan } from "./list-delete"
import type { ListColumn } from "./list-rows"
import type { RowKey } from "./list-selection"

type Item = { sku: string; name: string; category: string; stock: number }

const items: Item[] = [
  { sku: "A-1", name: "Espresso", category: "Drinks", stock: 12 },
  { sku: "A-2", name: "Latte", category: "Drinks", stock: 4 },
  { sku: "B-1", name: "Croissant", category: "Bakery", stock: 0 },
  { sku: "B-2", name: "Muffin", category: "Bakery", stock: 7 },
]

const columns: ListColumn<Item>[] = [
  { key: "name", header: "Name", get: (r) => r.name },
  { key: "sku", header: "SKU", get: (r) => r.sku },
  { key: "category", header: "Category", get: (r) => r.category },
  { key: "stock", header: "Stock", get: (r) => r.stock },
]

const keys = items.map((item) => item.sku)

function plan(targets: RowKey[], visible: RowKey[] = keys, limit?: number) {
  return deletePlan({
    rows: items,
    keys,
    columns,
    targets: new Set(targets),
    visible,
    limit,
  })
}

describe("deletePlan", () => {
  it("counts and previews the targeted rows", () => {
    const result = plan(["A-2"])
    expect(result.count).toBe(1)
    expect(result.more).toBe(0)
    expect(result.hidden).toBe(0)
    expect(result.preview).toEqual([
      {
        key: "A-2",
        primary: "Latte",
        details: [
          { label: "SKU", value: "A-2" },
          { label: "Category", value: "Drinks" },
        ],
      },
    ])
  })

  it("lists rows in table order, not selection order", () => {
    expect(plan(["B-1", "A-1"]).preview.map((r) => r.primary)).toEqual([
      "Espresso",
      "Croissant",
    ])
  })

  it("collapses rows past the preview limit into `more`", () => {
    const result = plan(keys, keys, 2)
    expect(result.count).toBe(4)
    expect(result.preview).toHaveLength(2)
    expect(result.more).toBe(2)
  })

  it("counts targeted rows the current filter hides", () => {
    // Only the Bakery rows pass the filter, but a Drinks row is still ticked.
    const result = plan(["A-1", "B-1"], ["B-1", "B-2"])
    expect(result.count).toBe(2)
    expect(result.hidden).toBe(1)
  })

  it("ignores keys that match no row", () => {
    const result = plan(["A-1", "gone"])
    expect(result.count).toBe(1)
    expect(result.preview).toHaveLength(1)
  })

  it("is empty when nothing is targeted", () => {
    expect(plan([])).toEqual({ count: 0, preview: [], more: 0, hidden: 0 })
  })

  it("falls back to the row key when there are no columns", () => {
    const result = deletePlan({
      rows: items,
      keys,
      columns: [],
      targets: new Set(["A-1"]),
      visible: keys,
    })
    expect(result.preview[0]).toEqual({
      key: "A-1",
      primary: "A-1",
      details: [],
    })
  })

  it("respects the detail-column budget", () => {
    const result = deletePlan({
      rows: items,
      keys,
      columns,
      targets: new Set(["A-1"]),
      visible: keys,
      detailColumns: 3,
    })
    expect(result.preview[0].details.map((d) => d.label)).toEqual([
      "SKU",
      "Category",
      "Stock",
    ])
  })
})
