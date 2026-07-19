import type { Tab } from "@/lib/tab-identity"

/**
 * Chip widths, keyed by `screenType` rather than tab id. A chip's width is a
 * pure function of its screen: the label comes from the registry, and the
 * active/inactive weight swap is already width-neutral (see the ghost `<span>`
 * in `TabChip`). So two tabs of the same type always measure the same, and one
 * measurement serves every duplicate — including tabs currently hidden inside
 * the overflow menu, which have no box to measure.
 */
export type ChipWidths = Partial<Record<string, number>>

export type PartitionInput = {
  tabs: Tab[]
  /** Measured chip widths by `screenType`. */
  widths: ChipWidths
  activeId: string | null
  /** Content width available to the strip, padding already subtracted. */
  containerWidth: number
  /** Measured (or estimated) width of the "More" button. */
  moreWidth: number
  /** Flex gap between chips, in px. */
  gap: number
}

export type Partition = {
  visible: Tab[]
  overflow: Tab[]
}

const allVisible = (tabs: Tab[]): Partition => ({ visible: tabs, overflow: [] })

/**
 * Split the open tabs into the run that fits the strip and the remainder that
 * collapses behind the "More" button.
 *
 * Two rules shape this beyond "fill until full":
 *
 * 1. **The active tab is always visible.** Its width is reserved off the top,
 *    before the left-to-right fill, so the tab whose screen is on display can
 *    never vanish into the menu — a later inactive tab is displaced instead.
 *    Reserving (rather than swapping afterwards) is what keeps the result
 *    stable: the budget the fill sees already accounts for the pin.
 * 2. **Visible tabs keep document order.** The fill picks *which* tabs make it;
 *    the final `filter` decides where they sit. A pinned active tab therefore
 *    stays in its true position rather than jumping to the end, so the strip
 *    doesn't reshuffle as focus moves.
 *
 * The fill `break`s on the first tab that doesn't fit instead of skipping ahead
 * to a narrower one — a contiguous prefix reads as "the rest are further right",
 * whereas a best-fit packing would scatter gaps through the strip.
 *
 * Returns everything visible when unmeasured (`containerWidth <= 0`, or a tab
 * whose type hasn't been measured yet). That's the deliberate first pass: render
 * all chips, let the layout effect record their widths, then partition on the
 * next commit.
 */
export function partitionTabs({
  tabs,
  widths,
  activeId,
  containerWidth,
  moreWidth,
  gap,
}: PartitionInput): Partition {
  if (tabs.length === 0) return allVisible(tabs)
  if (containerWidth <= 0) return allVisible(tabs)
  if (tabs.some((tab) => widths[tab.screenType] === undefined)) {
    return allVisible(tabs)
  }

  const widthOf = (tab: Tab) => widths[tab.screenType] ?? 0
  const total =
    tabs.reduce((sum, tab) => sum + widthOf(tab), 0) + gap * (tabs.length - 1)
  if (total <= containerWidth) return allVisible(tabs)

  // The "More" button costs its own width plus the gap that precedes it.
  const budget = containerWidth - moreWidth - gap
  const active = tabs.find((tab) => tab.id === activeId) ?? null

  const kept = new Set<string>()
  let used = 0
  if (active) {
    kept.add(active.id)
    used = widthOf(active)
  }

  for (const tab of tabs) {
    if (kept.has(tab.id)) continue
    const cost = (kept.size === 0 ? 0 : gap) + widthOf(tab)
    if (used + cost > budget) break
    used += cost
    kept.add(tab.id)
  }

  return {
    visible: tabs.filter((tab) => kept.has(tab.id)),
    overflow: tabs.filter((tab) => !kept.has(tab.id)),
  }
}
