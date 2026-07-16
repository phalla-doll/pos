import { describe, expect, it } from "vitest"

import {
  catalogue,
  deltaPct,
  hourlyMetrics,
  inventoryHealth,
  outstandingBalances,
  paymentMix,
  revenue,
  revenueByCategory,
  saleCost,
  saleTotal,
  salesByHour,
  summarizeKpis,
  topSellers,
} from "@/lib/analytics"
import type {
  Customer,
  InventoryItem,
  PaymentMethod,
  Sale,
} from "@/lib/fixtures"

/** A tiny catalogue with round numbers, so expectations stay readable. */
const item = (
  sku: string,
  name: string,
  category: string,
  price: number,
  cost: number,
  status: InventoryItem["status"] = "In Stock",
  stock = 10
): InventoryItem => ({
  sku,
  name,
  category,
  supplier: "Test Supplier",
  stock,
  unit: "each",
  price,
  cost,
  status,
})

const INVENTORY: InventoryItem[] = [
  item("A", "Apple", "Fruit", 2, 1), // 50% margin
  item("B", "Bread", "Bakery", 10, 8), // 20% margin
  item("C", "Cake", "Bakery", 5, 3), // 40% margin
]

const sale = (
  id: string,
  hour: number,
  method: PaymentMethod,
  lines: { sku: string; qty: number }[],
  customerId?: string
): Sale => ({ id, hour, time: `${hour}:00`, method, lines, customerId })

describe("saleTotal / saleCost", () => {
  const cat = catalogue(INVENTORY)

  it.each([
    { name: "single line", lines: [{ sku: "A", qty: 3 }], total: 6, cost: 3 },
    {
      name: "multiple lines",
      lines: [
        { sku: "A", qty: 2 },
        { sku: "B", qty: 1 },
      ],
      total: 14,
      cost: 10,
    },
    { name: "empty ticket", lines: [], total: 0, cost: 0 },
    {
      name: "unknown SKU contributes nothing",
      lines: [
        { sku: "A", qty: 1 },
        { sku: "NOPE", qty: 99 },
      ],
      total: 2,
      cost: 1,
    },
  ])("$name", ({ lines, total, cost }) => {
    const s = sale("t", 9, "Cash", lines)
    expect(saleTotal(s, cat)).toBe(total)
    expect(saleCost(s, cat)).toBe(cost)
  })

  it("rounds float sums to cents", () => {
    const cents = catalogue([item("X", "Xtra", "Misc", 0.1, 0.05)])
    const s = sale("t", 9, "Cash", [{ sku: "X", qty: 3 }])
    expect(saleTotal(s, cents)).toBe(0.3)
  })
})

describe("deltaPct", () => {
  it.each([
    { current: 110, previous: 100, expected: 0.1 },
    { current: 90, previous: 100, expected: -0.1 },
    { current: 100, previous: 100, expected: 0 },
    // No baseline to grow from — null, never Infinity.
    { current: 50, previous: 0, expected: null },
    { current: 0, previous: 0, expected: null },
  ])("$previous → $current = $expected", ({ current, previous, expected }) => {
    expect(deltaPct(current, previous)).toBe(expected)
  })
})

describe("summarizeKpis", () => {
  const today = [
    sale("1", 9, "Cash", [{ sku: "A", qty: 1 }]), // $2, cost $1
    sale("2", 9, "ABA", [{ sku: "B", qty: 1 }]), // $10, cost $8
  ]
  const yesterday = [sale("3", 9, "Cash", [{ sku: "A", qty: 3 }])] // $6, cost $3

  it("derives every headline from the tickets", () => {
    const k = summarizeKpis(today, yesterday, INVENTORY)
    expect(k.netSales.value).toBe(12)
    expect(k.netSales.previous).toBe(6)
    expect(k.netSales.delta).toBe(1) // +100%
    expect(k.transactions.value).toBe(2)
    expect(k.averageBasket.value).toBe(6) // 12 / 2
    // (12 - 9) / 12
    expect(k.grossMargin.value).toBeCloseTo(0.25, 5)
    expect(k.grossMargin.previous).toBeCloseTo(0.5, 5)
  })

  it("returns zeroes, not NaN, for a day with no tickets", () => {
    const k = summarizeKpis([], [], INVENTORY)
    expect(k.netSales.value).toBe(0)
    expect(k.averageBasket.value).toBe(0)
    expect(k.grossMargin.value).toBe(0)
    expect(k.netSales.delta).toBeNull()
  })
})

describe("salesByHour", () => {
  it("buckets both days onto a shared axis, keeping empty hours", () => {
    const points = salesByHour(
      [sale("1", 8, "Cash", [{ sku: "A", qty: 1 }])],
      [sale("2", 10, "Cash", [{ sku: "B", qty: 1 }])],
      INVENTORY,
      [8, 9, 10]
    )
    expect(points).toEqual([
      { hour: 8, label: "08:00", today: 2, yesterday: 0 },
      { hour: 9, label: "09:00", today: 0, yesterday: 0 },
      { hour: 10, label: "10:00", today: 0, yesterday: 10 },
    ])
  })

  it("sums several tickets in the same hour", () => {
    const points = salesByHour(
      [
        sale("1", 8, "Cash", [{ sku: "A", qty: 1 }]),
        sale("2", 8, "Cash", [{ sku: "A", qty: 2 }]),
      ],
      [],
      INVENTORY,
      [8]
    )
    expect(points[0].today).toBe(6)
  })
})

describe("hourlyMetrics", () => {
  it("measures each hour every way the tiles need", () => {
    const rows = hourlyMetrics(
      [
        sale("1", 8, "Cash", [{ sku: "A", qty: 1 }]), // $2, cost $1
        sale("2", 8, "Cash", [{ sku: "B", qty: 1 }]), // $10, cost $8
      ],
      INVENTORY,
      [8, 9]
    )
    expect(rows[0]).toEqual({
      hour: 8,
      label: "08:00",
      revenue: 12,
      transactions: 2,
      basket: 6,
      margin: 0.25, // (12 - 9) / 12
    })
  })

  it("reports an empty hour as zeroes, never NaN", () => {
    const [row] = hourlyMetrics([], INVENTORY, [8])
    expect(row).toEqual({
      hour: 8,
      label: "08:00",
      revenue: 0,
      transactions: 0,
      basket: 0,
      margin: 0,
    })
  })
})

describe("revenueByCategory", () => {
  it("ranks by revenue and shares sum to 1", () => {
    const rows = revenueByCategory(
      [
        sale("1", 9, "Cash", [{ sku: "A", qty: 1 }]), // Fruit $2
        sale("2", 9, "Cash", [{ sku: "B", qty: 1 }]), // Bakery $10
        sale("3", 9, "Cash", [{ sku: "C", qty: 2 }]), // Bakery $10
      ],
      INVENTORY
    )
    expect(rows.map((r) => r.category)).toEqual(["Bakery", "Fruit"])
    expect(rows[0].revenue).toBe(20)
    expect(rows[0].units).toBe(3)
    expect(rows[0].share).toBeCloseTo(20 / 22, 5)
    expect(rows.reduce((sum, r) => sum + r.share, 0)).toBeCloseTo(1, 5)
  })

  it("is empty for no sales", () => {
    expect(revenueByCategory([], INVENTORY)).toEqual([])
  })
})

describe("topSellers", () => {
  const sales = [
    sale("1", 9, "Cash", [{ sku: "A", qty: 5 }]), // $10
    sale("2", 9, "Cash", [{ sku: "B", qty: 2 }]), // $20
    sale("3", 9, "Cash", [{ sku: "C", qty: 1 }]), // $5
  ]

  it("ranks by revenue, not units", () => {
    // Apple moved the most units (5) but Bread earned the most.
    expect(topSellers(sales, INVENTORY, 3).map((r) => r.name)).toEqual([
      "Bread",
      "Apple",
      "Cake",
    ])
  })

  it("respects the limit", () => {
    expect(topSellers(sales, INVENTORY, 2)).toHaveLength(2)
  })

  it("breaks revenue ties by name, stably", () => {
    const tied = [
      sale("1", 9, "Cash", [{ sku: "B", qty: 1 }]), // $10
      sale("2", 9, "Cash", [{ sku: "A", qty: 5 }]), // $10
    ]
    expect(topSellers(tied, INVENTORY, 2).map((r) => r.name)).toEqual([
      "Apple",
      "Bread",
    ])
  })
})

describe("inventoryHealth", () => {
  it("counts by status and ranks the reorder list worst-first", () => {
    const stock: InventoryItem[] = [
      item("A", "Apple", "Fruit", 2, 1, "In Stock", 50),
      item("B", "Bread", "Bakery", 10, 8, "Low Stock", 4),
      item("C", "Cake", "Bakery", 5, 3, "Out of Stock", 0),
      item("D", "Donut", "Bakery", 1, 0.5, "Low Stock", 2),
    ]
    const health = inventoryHealth(stock)
    expect(health.counts).toEqual({
      "In Stock": 1,
      "Low Stock": 2,
      "Out of Stock": 1,
    })
    expect(health.total).toBe(4)
    // Out of stock first, then low stock by how little is left.
    expect(health.attention.map((i) => i.name)).toEqual([
      "Cake",
      "Donut",
      "Bread",
    ])
  })

  it("handles an empty catalogue", () => {
    const health = inventoryHealth([])
    expect(health.total).toBe(0)
    expect(health.attention).toEqual([])
  })
})

describe("paymentMix", () => {
  const METHODS: PaymentMethod[] = ["Cash", "ABA", "Wing", "Card"]

  it("splits revenue by method and drops unused ones", () => {
    const rows = paymentMix(
      [
        sale("1", 9, "Cash", [{ sku: "A", qty: 1 }]), // $2
        sale("2", 9, "ABA", [{ sku: "B", qty: 1 }]), // $10
        sale("3", 9, "Cash", [{ sku: "C", qty: 1 }]), // $5
      ],
      INVENTORY,
      METHODS
    )
    expect(rows.map((r) => r.method)).toEqual(["ABA", "Cash"])
    expect(rows[0].revenue).toBe(10)
    expect(rows[1].count).toBe(2)
    expect(rows.reduce((sum, r) => sum + r.share, 0)).toBeCloseTo(1, 5)
    // Wing and Card never appear — a zero-count method is not a slice.
    expect(rows.some((r) => r.method === "Wing")).toBe(false)
  })

  it("is empty for no sales", () => {
    expect(paymentMix([], INVENTORY, METHODS)).toEqual([])
  })
})

describe("outstandingBalances", () => {
  const customer = (name: string, balance: number): Customer => ({
    id: name,
    name,
    phone: "000",
    city: "Phnom Penh",
    status: "Active",
    balance,
  })

  it("ranks debtors and totals what is owed", () => {
    const { rows, total } = outstandingBalances(
      [
        customer("Ana", 10),
        customer("Bo", 0), // owes nothing — not a debtor
        customer("Cy", 30),
      ],
      5
    )
    expect(rows.map((r) => r.name)).toEqual(["Cy", "Ana"])
    expect(total).toBe(40)
  })

  it("respects the limit but totals every debtor", () => {
    const { rows, total } = outstandingBalances(
      [customer("Ana", 10), customer("Cy", 30), customer("Ed", 20)],
      1
    )
    expect(rows.map((r) => r.name)).toEqual(["Cy"])
    // The total is the whole book, not just the rows shown.
    expect(total).toBe(60)
  })

  it("handles nobody owing", () => {
    expect(outstandingBalances([customer("Bo", 0)], 5)).toEqual({
      rows: [],
      total: 0,
    })
  })
})

describe("revenue", () => {
  it("sums ticket totals", () => {
    expect(
      revenue(
        [
          sale("1", 9, "Cash", [{ sku: "A", qty: 1 }]),
          sale("2", 9, "Cash", [{ sku: "B", qty: 1 }]),
        ],
        catalogue(INVENTORY)
      )
    ).toBe(12)
  })

  it("is 0 for no sales", () => {
    expect(revenue([], catalogue(INVENTORY))).toBe(0)
  })
})
