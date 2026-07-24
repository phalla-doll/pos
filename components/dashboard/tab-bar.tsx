"use client"

import * as React from "react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getScreen } from "@/lib/screens"
import { refKey } from "@/lib/tab-identity"
import { partitionTabs, type ChipWidths } from "@/lib/tab-overflow"
import { tabTitle } from "@/lib/tab-title"
import type { Tab } from "@/hooks/use-tabs"
import { ChevronDown, Copy, X, XCircle, SquareX } from "lucide-react"

/**
 * Height + bottom edge of the tab-bar row. The strip itself is transparent
 * (`background`); contrast comes from a bottom hairline, which the active tab
 * punches through — its fill + flared corners erase the line beneath it, so it
 * reads as connected to the content below, browser-tab style. The hairline is
 * an *inset box-shadow*, not a `border-b`, on purpose: a border shrinks the
 * content box (border-box), so the strip's own children would sit 1px shy of
 * its full height and the h-8 chips would no longer meet the baseline cleanly.
 * A shadow takes no layout space, so the row fills the strip exactly and the
 * active tab's background simply paints over the inset line — no `-mb-px`
 * overflow needed. Shared so the Suspense fallback (`TabWorkspaceFallback`)
 * matches the bar's size exactly, instead of re-declaring the constant.
 */
export const TAB_BAR_ROW =
  "h-9 shrink-0 bg-background shadow-[inset_0_-1px_0_0_var(--border)]"

export type TabBarProps = {
  tabs: Tab[]
  activeId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onDuplicate: (id: string) => void
  onCloseOthers: (id: string) => void
  onCloseAll: () => void
}

/** `gap-1` and `px-2` on the strip, in px — the partitioner needs them numerically. */
const CHIP_GAP = 4
const STRIP_PADDING = 16

/**
 * Width assumed for the "More" button before it has ever rendered. Only used on
 * the single commit where overflow first appears: the button isn't in the DOM
 * until the partition says it's needed, so its true width can't be known then.
 * An over-estimate is the safe direction — it hides one chip too many for a
 * frame rather than overflowing the strip.
 */
const MORE_WIDTH_ESTIMATE = 92

/**
 * Horizontal strip of open tabs. Each tab shows the screen's icon + label and a
 * close affordance; the rest of the actions live in its right-click menu.
 *
 * The strip never scrolls. Tabs that don't fit collapse behind a "More" button
 * pinned to the end of the run — every tab stays one click away at a fixed
 * screen position, instead of somewhere along a scroll track the user has to go
 * find. `partitionTabs` decides the split (and guarantees the active tab is in
 * the visible half); this component only measures and renders.
 */
export function TabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onDuplicate,
  onCloseOthers,
  onCloseAll,
}: TabBarProps) {
  const stripRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(0)
  const [widths, setWidths] = React.useState<ChipWidths>({})
  const [moreWidth, setMoreWidth] = React.useState(MORE_WIDTH_ESTIMATE)

  React.useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const observer = new ResizeObserver(() => {
      setContainerWidth(strip.clientWidth - STRIP_PADDING)
    })
    observer.observe(strip)
    return () => observer.disconnect()
  }, [])

  // Record each rendered chip's width against its ref. Widths are keyed by ref
  // (not tab id) precisely so a ref measured once stays known while other tabs
  // of that ref sit in the overflow menu with no box of their own — and by the
  // whole ref, not the screen type, because a record tab's label names the
  // record and so no longer measures like its list — see `ChipWidths`. Only a
  // genuinely new width writes state, so this settles after the first paint
  // instead of looping.
  const measureChip = React.useCallback((key: string, width: number) => {
    setWidths((prev) =>
      prev[key] === width ? prev : { ...prev, [key]: width }
    )
  }, [])

  const { visible, overflow } = partitionTabs({
    tabs,
    widths,
    activeId,
    containerWidth,
    moreWidth,
    gap: CHIP_GAP,
  })

  return (
    <div className={cn("flex items-end", TAB_BAR_ROW)}>
      {/* Tabs sit flush to the bottom of the strip so the active tab's flared
          corners can merge into the content area beneath. `overflow-hidden`
          guards the measuring commit, where every chip renders at once so its
          width can be read — without it that pass would blow out the layout. */}
      <div
        ref={stripRef}
        className="flex h-9 min-w-0 flex-1 items-end gap-1 overflow-hidden px-2"
      >
        {visible.map((tab) => (
          <TabChip
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeId}
            onMeasure={measureChip}
            onSelect={onSelect}
            onClose={onClose}
            onDuplicate={onDuplicate}
            onCloseOthers={onCloseOthers}
            onCloseAll={onCloseAll}
          />
        ))}
        {overflow.length > 0 && (
          <OverflowMenu
            tabs={overflow}
            onMeasure={setMoreWidth}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  )
}

type OverflowMenuProps = {
  tabs: Tab[]
  onMeasure: (width: number) => void
  onSelect: (id: string) => void
}

/**
 * The "More" button and its list of collapsed tabs. Selecting one focuses it —
 * and because `partitionTabs` pins the active tab, the chosen tab immediately
 * takes a visible slot, so the menu doubles as the way back out of overflow.
 */
function OverflowMenu({ tabs, onMeasure, onSelect }: OverflowMenuProps) {
  const measure = React.useCallback(
    (node: HTMLButtonElement | null) => {
      if (node) onMeasure(node.offsetWidth)
    },
    [onMeasure]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            ref={measure}
            type="button"
            aria-label={`Show ${tabs.length} more ${tabs.length === 1 ? "tab" : "tabs"}`}
            className="flex h-8 shrink-0 items-center gap-1 rounded-t-lg px-2.5 text-sm font-normal text-muted-foreground transition-colors duration-150 hover:text-foreground [&_svg]:size-3.5 [&_svg]:shrink-0"
          >
            <span>More</span>
            <span className="tabular-nums">{tabs.length}</span>
            <ChevronDown strokeWidth={1.5} />
          </button>
        }
      />
      {/* `w-auto` is load-bearing: the menu's default is `w-(--anchor-width)`,
          which sizes it to its trigger. That suits a select, but here the
          trigger is a narrow "More n" button, so screen labels would be
          clipped by the very button that hides them. Size to the labels
          instead, with a max so one long name can't stretch the menu across
          the strip — only then does the item's `truncate` come into play. */}
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-auto max-w-72 min-w-44 overflow-y-auto"
      >
        {tabs.map((tab) => (
          <DropdownMenuItem key={tab.id} onClick={() => onSelect(tab.id)}>
            {getScreen(tab.screenType)?.icon}
            <span className="truncate">{tabTitle(tab)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type TabChipProps = {
  tab: Tab
  isActive: boolean
  onMeasure: (refKey: string, width: number) => void
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onDuplicate: (id: string) => void
  onCloseOthers: (id: string) => void
  onCloseAll: () => void
}

function TabChip({
  tab,
  isActive,
  onMeasure,
  onSelect,
  onClose,
  onDuplicate,
  onCloseOthers,
  onCloseAll,
}: TabChipProps) {
  const label = tabTitle(tab)
  const icon = getScreen(tab.screenType)?.icon

  const key = refKey(tab)
  const measure = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node) onMeasure(key, node.offsetWidth)
    },
    [onMeasure, key]
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            ref={measure}
            data-slot="tab-chip"
            data-active={isActive}
            className={cn(
              // `--tab-active` is the active tab's fill, shared by the body and
              // the flared corners so they can never drift apart. It's a *mix*
              // of primary into the background rather than `primary/10` so it
              // stays fully opaque — the fill has to erase the strip's hairline
              // beneath it. Dark mode drops the hue entirely and lifts a
              // neutral zinc step off the near-black background instead: a
              // tinted fill that reads as "raised" at L 0.145 has to be so
              // saturated it turns into a colored block, which is louder than
              // a tab chrome should be.
              "group/tab relative flex shrink-0 items-center gap-1 rounded-t-lg pr-1.5 pl-2.5 text-sm transition-[background-color,color] duration-150",
              "[--tab-active:color-mix(in_oklab,var(--primary)_12%,var(--background))]",
              "dark:[--tab-active:var(--color-zinc-800)]",
              isActive
                ? "h-8 bg-[var(--tab-active)] font-medium text-foreground"
                : "h-8 font-normal text-muted-foreground hover:text-foreground"
            )}
          />
        }
      >
        <button
          type="button"
          onClick={() => onSelect(tab.id)}
          className="flex h-full items-center gap-1.5 outline-none [&_svg]:size-4 [&_svg]:shrink-0"
        >
          {icon}
          {/* Reserve the bold width with an invisible ghost so switching
              between active (medium) and inactive (normal) weights doesn't
              reflow the tab and shift its neighbors. */}
          <span className="grid max-w-40">
            <span
              aria-hidden
              className="invisible col-start-1 row-start-1 truncate font-medium"
            >
              {label}
            </span>
            <span className="col-start-1 row-start-1 truncate">{label}</span>
          </span>
        </button>

        {/* Close — the only inline action. Active tabs always show it;
            inactive tabs reveal it on hover. Everything else lives in the
            right-click menu, so there's a single, unambiguous target. */}
        <button
          type="button"
          onClick={() => onClose(tab.id)}
          aria-label={`Close ${label} tab`}
          className={cn(
            "flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-opacity duration-150 hover:bg-accent hover:text-foreground [&_svg]:size-3.5",
            isActive ? "opacity-100" : "opacity-0 group-hover/tab:opacity-100"
          )}
        >
          <X strokeWidth={1.5} />
        </button>

        {/* Flared bottom corners — the browser-tab signature. Each is an 8px
            square just outside the tab, filled with the tab's `--tab-active`
            color everywhere except a quarter-circle carved from the corner
            nearest the tab, so the rounded body sweeps concavely down to the
            strip baseline instead of ending in a hard right angle. */}
        {isActive && (
          <>
            <span className="pointer-events-none absolute bottom-0 left-[-8px] size-2 bg-[radial-gradient(circle_at_top_left,transparent_7.5px,var(--tab-active)_8px)]" />
            <span className="pointer-events-none absolute right-[-8px] bottom-0 size-2 bg-[radial-gradient(circle_at_top_right,transparent_7.5px,var(--tab-active)_8px)]" />
          </>
        )}
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => onDuplicate(tab.id)}>
          <Copy strokeWidth={1.5} />
          <span>Duplicate</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onClose(tab.id)}>
          <X strokeWidth={1.5} />
          <span>Close</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onCloseOthers(tab.id)}>
          <SquareX strokeWidth={1.5} />
          <span>Close others</span>
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" onClick={onCloseAll}>
          <XCircle strokeWidth={1.5} />
          <span>Close all</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
