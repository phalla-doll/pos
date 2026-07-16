"use client"

import * as React from "react"
import { Area, AreaChart } from "recharts"
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { signedPercent } from "@/lib/format"
import type { Kpi } from "@/lib/analytics"
import { cn } from "@/lib/utils"

/** The sparkline is one series, so it needs one hue: categorical slot 1. */
const SPARK_CONFIG = {
  value: { label: "Value", color: "var(--chart-cat-1)" },
} satisfies ChartConfig

/**
 * Which way a delta points, and whether that is good news. Kept as data so the
 * icon and the hue are chosen once, not re-derived at each use site.
 */
const DIRECTIONS = {
  up: { icon: ArrowUpRight, tone: "text-status-good" },
  down: { icon: ArrowDownRight, tone: "text-status-critical" },
  flat: { icon: ArrowRight, tone: "text-muted-foreground" },
} as const

function direction(delta: number | null) {
  if (delta === null || delta === 0) return DIRECTIONS.flat
  return delta > 0 ? DIRECTIONS.up : DIRECTIONS.down
}

/**
 * A headline figure: its value, the change against the prior day, and the
 * shape of the day behind it.
 *
 * The delta's hue rides on the arrow icon, never the text — a status hue at
 * icon contrast (3:1) is legible where the same hue on small text (4.5:1) is
 * not, and the arrow doubles as the non-color cue for the direction.
 */
export function StatCard({
  label,
  value,
  kpi,
  spark,
  goodWhenUp = true,
}: {
  label: string
  /** The formatted headline — the caller knows whether it's money or a count. */
  value: string
  kpi: Kpi
  /** The metric's shape across the trading day, oldest first. */
  spark: number[]
  /** Set false where a rise is bad news, so the tone follows meaning. */
  goodWhenUp?: boolean
}) {
  const signed = goodWhenUp || kpi.delta === null ? kpi.delta : -kpi.delta
  const { icon: Icon, tone } = direction(signed)
  const data = spark.map((v, hour) => ({ hour, value: v }))
  // An SVG url(#id) reference can't contain spaces, so the id can't be derived
  // from the label — `url(#spark-Net sales)` silently fails to a black fill.
  const gradientId = `spark${React.useId().replace(/:/g, "")}`

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="flex flex-col gap-3 px-4 pt-4 pb-0">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div className="flex flex-col gap-1">
          {/* Proportional figures: tabular-nums makes a display number look loose. */}
          <span className="text-3xl leading-none font-semibold tracking-tight">
            {value}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Icon className={cn("size-3.5 shrink-0", tone)} aria-hidden />
            <span className="tabular-nums">{signedPercent(kpi.delta)}</span>
            <span>vs yesterday</span>
          </span>
        </div>
      </CardContent>
      {/* The day's shape, as context under the number — the axis is the card. */}
      <ChartContainer
        config={SPARK_CONFIG}
        className="aspect-auto h-10 w-full [&_.recharts-surface]:overflow-visible"
      >
        <AreaChart
          data={data}
          margin={{ top: 4, left: 0, right: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-value)"
                stopOpacity={0.22}
              />
              <stop
                offset="100%"
                stopColor="var(--color-value)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  )
}
