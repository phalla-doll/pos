/**
 * Dashboard analytics — the "what do the tickets say" layer.
 *
 * Every figure the dashboard shows is computed here from tickets plus the
 * product catalogue: nothing is stored pre-totalled, so a headline number can
 * never disagree with the rows beneath it. Pure and data-only (plain data in,
 * plain data out, no React, no clock, no randomness) so the whole dashboard is
 * testable without rendering anything.
 */

import type {
  Customer,
  InventoryItem,
  PaymentMethod,
  Sale,
} from "@/lib/fixtures"

/** Round to cents — float sums like 1234.5600000000001 never reach the UI. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** The catalogue keyed by SKU, so ticket lines can be priced in one pass. */
export type Catalogue = Map<string, InventoryItem>

/** Index the catalogue for lookup. Built once and threaded through. */
export function catalogue(inventory: InventoryItem[]): Catalogue {
  return new Map(inventory.map((item) => [item.sku, item]))
}

/**
 * What a ticket rang up. Lines referencing an unknown SKU contribute nothing
 * rather than throwing — a dashboard should degrade, not crash, on bad data.
 */
export function saleTotal(sale: Sale, cat: Catalogue): number {
  let total = 0
  for (const line of sale.lines) {
    const item = cat.get(line.sku)
    if (item) total += item.price * line.qty
  }
  return round2(total)
}

/** What that ticket cost us at supplier prices — the basis for margin. */
export function saleCost(sale: Sale, cat: Catalogue): number {
  let total = 0
  for (const line of sale.lines) {
    const item = cat.get(line.sku)
    if (item) total += item.cost * line.qty
  }
  return round2(total)
}

/** Sum of ticket totals. */
export function revenue(sales: Sale[], cat: Catalogue): number {
  return round2(sales.reduce((sum, sale) => sum + saleTotal(sale, cat), 0))
}

/**
 * Relative change from `previous` to `current`, as a fraction (0.08 = +8%).
 * Returns `null` when there's no baseline to compare against — growth from
 * zero is undefined, and `Infinity%` is not a thing to put on a dashboard.
 */
export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null
  return (current - previous) / previous
}

/** A headline figure with its prior-period baseline and the change between. */
export type Kpi = {
  value: number
  previous: number
  /** Fractional change vs. `previous`; `null` when `previous` is 0. */
  delta: number | null
}

const kpi = (value: number, previous: number): Kpi => ({
  value,
  previous,
  delta: deltaPct(value, previous),
})

/** The four headline figures, each against the same hour of the prior day. */
export type DashboardKpis = {
  netSales: Kpi
  transactions: Kpi
  averageBasket: Kpi
  /** Gross margin as a fraction of revenue (0.31 = 31%). */
  grossMargin: Kpi
}

/** Average ticket value; 0 for a day with no tickets (never NaN). */
function basket(sales: Sale[], cat: Catalogue): number {
  if (sales.length === 0) return 0
  return round2(revenue(sales, cat) / sales.length)
}

/** Gross margin as a fraction of revenue; 0 when nothing was sold. */
function margin(sales: Sale[], cat: Catalogue): number {
  const sold = revenue(sales, cat)
  if (sold === 0) return 0
  const cost = round2(sales.reduce((sum, s) => sum + saleCost(s, cat), 0))
  return (sold - cost) / sold
}

export function summarizeKpis(
  today: Sale[],
  yesterday: Sale[],
  inventory: InventoryItem[]
): DashboardKpis {
  const cat = catalogue(inventory)
  return {
    netSales: kpi(revenue(today, cat), revenue(yesterday, cat)),
    transactions: kpi(today.length, yesterday.length),
    averageBasket: kpi(basket(today, cat), basket(yesterday, cat)),
    grossMargin: kpi(margin(today, cat), margin(yesterday, cat)),
  }
}

/** One trading hour, measured every way the dashboard needs. */
export type HourlyMetrics = {
  hour: number
  /** Axis label, e.g. "18:00". */
  label: string
  revenue: number
  transactions: number
  /** Average ticket value in the hour; 0 when nothing sold. */
  basket: number
  /** Gross margin as a fraction of the hour's revenue; 0 when nothing sold. */
  margin: number
}

/** The metrics a KPI tile can chart — the keys of {@link HourlyMetrics}. */
export type Metric = "revenue" | "transactions" | "basket" | "margin"

/**
 * One day broken down by trading hour. Hours with no tickets are kept as
 * zeroes so a curve has no gaps and two days can share an x-axis. This is the
 * single bucketing pass behind both the day curve and the KPI sparklines.
 */
export function hourlyMetrics(
  sales: Sale[],
  inventory: InventoryItem[],
  hours: number[]
): HourlyMetrics[] {
  const cat = catalogue(inventory)
  const buckets = new Map<
    number,
    { revenue: number; cost: number; count: number }
  >()
  for (const sale of sales) {
    const entry = buckets.get(sale.hour) ?? { revenue: 0, cost: 0, count: 0 }
    entry.revenue += saleTotal(sale, cat)
    entry.cost += saleCost(sale, cat)
    entry.count += 1
    buckets.set(sale.hour, entry)
  }
  return hours.map((hour) => {
    const e = buckets.get(hour) ?? { revenue: 0, cost: 0, count: 0 }
    return {
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      revenue: round2(e.revenue),
      transactions: e.count,
      basket: e.count === 0 ? 0 : round2(e.revenue / e.count),
      margin: e.revenue === 0 ? 0 : (e.revenue - e.cost) / e.revenue,
    }
  })
}

/** One point on the two-day trading curve. */
export type HourPoint = {
  hour: number
  label: string
  today: number
  yesterday: number
}

/** Revenue per trading hour for both days, on one shared axis. */
export function salesByHour(
  today: Sale[],
  yesterday: Sale[],
  inventory: InventoryItem[],
  hours: number[]
): HourPoint[] {
  const t = hourlyMetrics(today, inventory, hours)
  const y = hourlyMetrics(yesterday, inventory, hours)
  return t.map((point, i) => ({
    hour: point.hour,
    label: point.label,
    today: point.revenue,
    yesterday: y[i].revenue,
  }))
}

/** Revenue rolled up to a product category. */
export type CategoryRevenue = {
  category: string
  revenue: number
  units: number
  /** Fraction of total revenue (0.42 = 42%). */
  share: number
}

/**
 * Categories ranked by revenue, highest first. Ties break by name so the order
 * is stable rather than dependent on catalogue order.
 */
export function revenueByCategory(
  sales: Sale[],
  inventory: InventoryItem[]
): CategoryRevenue[] {
  const cat = catalogue(inventory)
  const totals = new Map<string, { revenue: number; units: number }>()
  for (const sale of sales) {
    for (const line of sale.lines) {
      const item = cat.get(line.sku)
      if (!item) continue
      const entry = totals.get(item.category) ?? { revenue: 0, units: 0 }
      entry.revenue += item.price * line.qty
      entry.units += line.qty
      totals.set(item.category, entry)
    }
  }
  const total = [...totals.values()].reduce((sum, e) => sum + e.revenue, 0)
  return [...totals]
    .map(([category, e]) => ({
      category,
      revenue: round2(e.revenue),
      units: e.units,
      share: total === 0 ? 0 : e.revenue / total,
    }))
    .sort(
      (a, b) => b.revenue - a.revenue || a.category.localeCompare(b.category)
    )
}

/** A product's contribution to the day. */
export type SellerRow = {
  sku: string
  name: string
  category: string
  units: number
  revenue: number
}

/**
 * The `limit` best-selling products by revenue, highest first. Ties break by
 * name to keep the order stable.
 */
export function topSellers(
  sales: Sale[],
  inventory: InventoryItem[],
  limit: number
): SellerRow[] {
  const cat = catalogue(inventory)
  const totals = new Map<string, { units: number; revenue: number }>()
  for (const sale of sales) {
    for (const line of sale.lines) {
      const item = cat.get(line.sku)
      if (!item) continue
      const entry = totals.get(item.sku) ?? { units: 0, revenue: 0 }
      entry.units += line.qty
      entry.revenue += item.price * line.qty
      totals.set(item.sku, entry)
    }
  }
  return [...totals]
    .map(([sku, e]) => {
      const item = cat.get(sku)!
      return {
        sku,
        name: item.name,
        category: item.category,
        units: e.units,
        revenue: round2(e.revenue),
      }
    })
    .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name))
    .slice(0, limit)
}

/** Stock status, derived from the catalogue rather than restated. */
export type StockStatus = InventoryItem["status"]

export type InventoryHealth = {
  counts: Record<StockStatus, number>
  total: number
  /** Items that are low or out — the reorder list, worst first. */
  attention: InventoryItem[]
}

/** The order stock status degrades in — drives both the bar and the legend. */
export const STOCK_STATUSES: StockStatus[] = [
  "In Stock",
  "Low Stock",
  "Out of Stock",
]

/**
 * Stock status counts plus the items needing a reorder. Out-of-stock sorts
 * ahead of low-stock, then by how little is left.
 */
export function inventoryHealth(inventory: InventoryItem[]): InventoryHealth {
  const counts = { "In Stock": 0, "Low Stock": 0, "Out of Stock": 0 }
  for (const item of inventory) counts[item.status] += 1
  const attention = inventory
    .filter((item) => item.status !== "In Stock")
    .sort(
      (a, b) =>
        STOCK_STATUSES.indexOf(b.status) - STOCK_STATUSES.indexOf(a.status) ||
        a.stock - b.stock
    )
  return { counts, total: inventory.length, attention }
}

/** How the day's money came in, by method. */
export type PaymentShare = {
  method: PaymentMethod
  count: number
  revenue: number
  /** Fraction of total revenue (0.52 = 52%). */
  share: number
}

/**
 * Revenue split by payment method, highest first. `methods` fixes the slot
 * order so a method always keeps its color even as the ranking moves.
 */
export function paymentMix(
  sales: Sale[],
  inventory: InventoryItem[],
  methods: readonly PaymentMethod[]
): PaymentShare[] {
  const cat = catalogue(inventory)
  const totals = new Map<PaymentMethod, { count: number; revenue: number }>()
  for (const sale of sales) {
    const entry = totals.get(sale.method) ?? { count: 0, revenue: 0 }
    entry.count += 1
    entry.revenue += saleTotal(sale, cat)
    totals.set(sale.method, entry)
  }
  const total = [...totals.values()].reduce((sum, e) => sum + e.revenue, 0)
  return methods
    .map((method) => {
      const e = totals.get(method) ?? { count: 0, revenue: 0 }
      return {
        method,
        count: e.count,
        revenue: round2(e.revenue),
        share: total === 0 ? 0 : e.revenue / total,
      }
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.revenue - a.revenue)
}

export type Outstanding = {
  /** Customers who owe, most owed first. */
  rows: Customer[]
  total: number
}

/**
 * Who owes money, ranked. Customers with a zero balance are dropped — a
 * "customer owed" panel listing people who owe nothing is noise.
 */
export function outstandingBalances(
  customers: Customer[],
  limit: number
): Outstanding {
  const owing = customers.filter((c) => c.balance > 0)
  const total = round2(owing.reduce((sum, c) => sum + c.balance, 0))
  const rows = [...owing]
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name))
    .slice(0, limit)
  return { rows, total }
}
