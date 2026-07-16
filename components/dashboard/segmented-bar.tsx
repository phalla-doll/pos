/**
 * A part-to-whole bar: one track, one segment per class, sized by share, with
 * a legend beneath. Shared by every "how does the whole split up" panel —
 * payment mix and stock health are the same form and use this rather than each
 * growing its own bar.
 */

export type Segment = {
  key: string
  label: string
  /** The raw magnitude this segment's width encodes. */
  value: number
  /** The segment's color — a CSS value, e.g. `var(--chart-cat-1)`. */
  color: string
  /** Right-hand legend text, e.g. `47% · 148 tickets`. */
  meta?: string
  /**
   * Legend mark. Defaults to a color swatch; pass an icon for status classes,
   * which must never be identified by color alone.
   */
  icon?: React.ReactNode
}

/**
 * Segments render in the order given — the caller fixes the order so a class
 * keeps its color even as the ranking moves. Segments are separated by a 2px
 * surface gap rather than a border, so nothing draws a line around the data.
 */
export function SegmentedBar({
  segments,
  empty = "Nothing to show yet.",
}: {
  segments: Segment[]
  empty?: string
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  if (total === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-2.5 gap-[2px] overflow-hidden">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.key}
              className="h-full rounded-full"
              style={{
                width: `${(s.value / total) * 100}%`,
                backgroundColor: s.color,
              }}
            />
          ))}
      </div>
      {/* The legend is what makes each class identifiable without relying on
          color — it is present for every segmented bar, not only crowded ones. */}
      <ul className="flex flex-col gap-2">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            {s.icon ?? (
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
            )}
            <span className="truncate">{s.label}</span>
            {s.meta && (
              <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
                {s.meta}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
