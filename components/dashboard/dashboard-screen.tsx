"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CircleAlert, CircleCheck, CircleX, TrendingUp } from "lucide-react"

import { ScreenHeader } from "@/components/dashboard/screen-header"
import { RankedBars, type RankedRow } from "@/components/dashboard/ranked-bars"
import {
  SegmentedBar,
  type Segment,
} from "@/components/dashboard/segmented-bar"
import { StatCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  hourlyMetrics,
  inventoryHealth,
  outstandingBalances,
  paymentMix,
  revenueByCategory,
  salesByHour,
  summarizeKpis,
  topSellers,
  STOCK_STATUSES,
  type StockStatus,
} from "@/lib/analytics"
import {
  businessDate,
  sampleCustomers,
  sampleInventory,
  todaySales,
  TRADING_HOURS,
  yesterdaySales,
  type PaymentMethod,
} from "@/lib/fixtures"
import { axisMoney, money, percent, wholeMoney } from "@/lib/format"

/**
 * Payment methods in slot order, each pinned to a categorical color. The order
 * is fixed and the ranking is not: Cash stays emerald even on a day ABA
 * outsells it, so a reader who learned the color keeps it.
 */
const PAYMENT_SLOTS: { method: PaymentMethod; color: string }[] = [
  { method: "Cash", color: "var(--chart-cat-1)" },
  { method: "ABA", color: "var(--chart-cat-2)" },
  { method: "Wing", color: "var(--chart-cat-3)" },
  { method: "Card", color: "var(--chart-cat-4)" },
]

const PAYMENT_METHODS = PAYMENT_SLOTS.map((slot) => slot.method)

/**
 * Stock status wears the reserved status scale, not a series color — these
 * classes mean good/warning/critical. Each ships with an icon so the state is
 * never carried by color alone.
 */
const STATUS_TONE: Record<
  StockStatus,
  { color: string; icon: typeof CircleCheck }
> = {
  "In Stock": { color: "var(--status-good)", icon: CircleCheck },
  "Low Stock": { color: "var(--status-warning)", icon: CircleAlert },
  "Out of Stock": { color: "var(--status-critical)", icon: CircleX },
}

/**
 * Today leads in the accent hue; yesterday is context in a recessive gray.
 * Two series, so the chart carries a legend.
 */
const DAY_CONFIG = {
  today: { label: "Today", color: "var(--chart-cat-1)" },
  yesterday: { label: "Yesterday", color: "var(--muted-foreground)" },
} satisfies ChartConfig

/**
 * The store at a glance. A thin renderer: every figure below is derived by
 * `@/lib/analytics` from the day's tickets plus the catalogue, so this file
 * decides how things look and nothing about what they mean.
 */
export function DashboardScreen({
  label,
  description,
}: {
  label: string
  description: string
}) {
  // The fixtures are module constants, so this is one pass per mount (each tab
  // switch remounts the screen) rather than a recompute on every render.
  const data = React.useMemo(() => {
    const hours = hourlyMetrics(todaySales, sampleInventory, TRADING_HOURS)
    return {
      kpis: summarizeKpis(todaySales, yesterdaySales, sampleInventory),
      hours,
      curve: salesByHour(
        todaySales,
        yesterdaySales,
        sampleInventory,
        TRADING_HOURS
      ),
      categories: revenueByCategory(todaySales, sampleInventory),
      sellers: topSellers(todaySales, sampleInventory, 6),
      health: inventoryHealth(sampleInventory),
      payments: paymentMix(todaySales, sampleInventory, PAYMENT_METHODS),
      owed: outstandingBalances(sampleCustomers, 5),
    }
  }, [])

  const { kpis, hours, curve, categories, sellers, health, payments, owed } =
    data

  const peak = hours.reduce((best, h) => (h.revenue > best.revenue ? h : best))

  const paymentSegments: Segment[] = payments.map((row) => {
    const slot = PAYMENT_SLOTS.find((s) => s.method === row.method)!
    return {
      key: row.method,
      label: row.method,
      value: row.revenue,
      color: slot.color,
      meta: `${percent(row.share)} · ${row.count}`,
    }
  })

  const stockSegments: Segment[] = STOCK_STATUSES.map((status) => {
    const { color, icon: Icon } = STATUS_TONE[status]
    return {
      key: status,
      label: status,
      value: health.counts[status],
      color,
      meta: `${health.counts[status]} SKUs`,
      icon: (
        <Icon aria-hidden className="size-3.5 shrink-0" style={{ color }} />
      ),
    }
  })

  const sellerRows: RankedRow[] = sellers.map((s) => ({
    key: s.sku,
    label: s.name,
    value: money(s.revenue),
    sub: `${s.units} sold`,
    magnitude: s.revenue,
  }))

  const categoryRows: RankedRow[] = categories.map((c) => ({
    key: c.category,
    label: c.category,
    value: money(c.revenue),
    sub: percent(c.share),
    magnitude: c.revenue,
  }))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
      <ScreenHeader
        label={label}
        description={description}
        actions={
          <Badge variant="secondary" className="shrink-0 gap-1.5">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-good opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-status-good" />
            </span>
            Trading · {businessDate}
          </Badge>
        }
      />

      {/* The four headlines. Each carries its own shape across the day. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net sales"
          value={wholeMoney(kpis.netSales.value)}
          kpi={kpis.netSales}
          spark={hours.map((h) => h.revenue)}
        />
        <StatCard
          label="Transactions"
          value={kpis.transactions.value.toLocaleString("en-US")}
          kpi={kpis.transactions}
          spark={hours.map((h) => h.transactions)}
        />
        <StatCard
          label="Average basket"
          value={money(kpis.averageBasket.value)}
          kpi={kpis.averageBasket}
          spark={hours.map((h) => h.basket)}
        />
        <StatCard
          label="Gross margin"
          value={percent(kpis.grossMargin.value, 1)}
          kpi={kpis.grossMargin}
          spark={hours.map((h) => h.margin)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* The centrepiece: the shape of the trading day against yesterday. */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trading day</CardTitle>
            <CardDescription>
              Revenue per hour, 7am to 9pm, against the same hour yesterday.
            </CardDescription>
            <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
              <Badge variant="outline" className="gap-1.5">
                <TrendingUp className="size-3.5" aria-hidden />
                Peak {peak.label} · {wholeMoney(peak.revenue)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={DAY_CONFIG}
              className="aspect-auto h-[280px] w-full"
            >
              <AreaChart
                data={curve}
                // The right margin is the half-width of the last x tick — at 8
                // the closing "21:00" label loses its last character.
                margin={{ top: 8, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fill-today" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-today)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-today)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="0" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  // Every other hour — 15 ticks would collide on a narrow card.
                  interval={1}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={52}
                  tickFormatter={axisMoney}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value, name) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {DAY_CONFIG[name as keyof typeof DAY_CONFIG]?.label}
                          </span>
                          <span className="font-medium tabular-nums">
                            {money(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                {/*
                  Yesterday sits behind, in gray — context, not a rival. Every
                  tab switch remounts this screen, so the entry animation is
                  clipped well under Recharts' 1.5s default: at full length it
                  reads as a page still loading on every visit.
                */}
                <Area
                  dataKey="yesterday"
                  type="monotone"
                  stroke="var(--color-yesterday)"
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                  fill="none"
                  dot={false}
                  activeDot={{ r: 3 }}
                  animationDuration={450}
                />
                <Area
                  dataKey="today"
                  type="monotone"
                  stroke="var(--color-today)"
                  strokeWidth={2}
                  fill="url(#fill-today)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                  animationDuration={450}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Stock health — the one panel that is a to-do list, not a report. */}
        <Card>
          <CardHeader>
            <CardTitle>Stock health</CardTitle>
            <CardDescription>
              {health.total} SKUs tracked · {health.attention.length} need
              attention.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <SegmentedBar segments={stockSegments} empty="No SKUs tracked." />
            {health.attention.length > 0 && (
              <div className="flex flex-col gap-2 border-t pt-4">
                <span className="text-xs font-medium text-muted-foreground">
                  Reorder list
                </span>
                <ul className="flex flex-col gap-2">
                  {health.attention.map((item) => {
                    const { color, icon: Icon } = STATUS_TONE[item.status]
                    return (
                      <li
                        key={item.sku}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Icon
                          aria-hidden
                          className="size-3.5 shrink-0"
                          style={{ color }}
                        />
                        <span className="truncate">{item.name}</span>
                        <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
                          {item.stock} {item.unit}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top sellers</CardTitle>
            <CardDescription>Best earners today, by revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            <RankedBars rows={sellerRows} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by category</CardTitle>
            <CardDescription>
              Where today&apos;s {wholeMoney(kpis.netSales.value)} came from.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankedBars rows={categoryRows} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How they paid</CardTitle>
            <CardDescription>
              Share of revenue by method, and the ticket count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedBar
              segments={paymentSegments}
              empty="No tickets today."
            />
          </CardContent>
        </Card>
      </div>

      {/* Money on the street — the other half of a day's takings. */}
      <Card>
        <CardHeader>
          <CardTitle>Customer accounts</CardTitle>
          <CardDescription>
            {money(owed.total)} outstanding across {owed.rows.length} accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {owed.rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nobody owes a thing.
            </p>
          ) : (
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {owed.rows.map((customer) => (
                <li
                  key={customer.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {customer.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      {customer.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {customer.city}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 font-medium tabular-nums">
                    {money(customer.balance)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
