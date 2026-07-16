/**
 * A ranked bar list: label, a bar for magnitude, and the value direct-labelled
 * beside it. One renderer for every "what's biggest" panel on the dashboard —
 * top sellers and category revenue are the same shape and share this rather
 * than forking a copy each.
 */

export type RankedRow = {
  /** Stable identity for the React key. */
  key: string
  label: string
  /** Optional second line, e.g. a category or a unit count. */
  sub?: string
  /** The value, already formatted by the caller. */
  value: string
  /** The raw magnitude the bar length encodes. */
  magnitude: number
}

/**
 * Rows are drawn in the order given — the caller ranks them. Bars scale to the
 * largest row so the top bar always fills the track and the rest read against
 * it.
 *
 * Every bar wears the same hue on purpose: these categories are nominal
 * (products, product categories), so bar length already encodes the value.
 * Shading each bar by its own size would spend the color channel re-encoding
 * what length shows, and imply an order the categories don't have.
 */
export function RankedBars({ rows }: { rows: RankedRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nothing sold today.
      </p>
    )
  }

  const max = Math.max(...rows.map((row) => row.magnitude))

  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((row) => (
        <li key={row.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium">{row.label}</span>
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {row.value}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-cat-1"
                style={{
                  width: `${max === 0 ? 0 : (row.magnitude / max) * 100}%`,
                }}
              />
            </div>
            {row.sub && (
              <span className="w-20 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {row.sub}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
