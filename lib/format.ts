/**
 * Display formatting for the dashboard's numbers. Pure string-building, kept
 * out of the components so every figure is formatted one way and the rules are
 * testable without rendering. Locale is pinned to `en-US` so a server render
 * and a client render can never disagree about a comma.
 */

const MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const WHOLE_MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

/** Money with cents, e.g. `$1,220.20`. */
export function money(value: number): string {
  return MONEY.format(value)
}

/** Money rounded to whole dollars, e.g. `$1,220` — for headline figures. */
export function wholeMoney(value: number): string {
  return WHOLE_MONEY.format(value)
}

/**
 * Compact money for axis ticks, e.g. `$1.2k`. Axis labels are read at a glance
 * and repeat down the scale, so they trade precision for width.
 */
export function axisMoney(value: number): string {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${Math.round(value)}`
}

/** A fraction as a percentage, e.g. `0.247` → `25%`. */
export function percent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`
}

/**
 * A signed change for a KPI delta, e.g. `+14.5%` / `−0.7%`. Renders an em dash
 * for `null` — the "no baseline to compare against" case, which must read as
 * "not applicable" rather than as zero change. Uses a real minus sign (U+2212)
 * so negatives line up with the plus and don't read as a hyphen.
 */
export function signedPercent(value: number | null): string {
  if (value === null) return "—"
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${Math.abs(value * 100).toFixed(1)}%`
}
