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
  DropdownMenuLabel,
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
 * Height + bottom edge of the tab-bar row. The strip shares the workspace
 * surface it sits on (`--content`) rather than the page white — the two meet
 * with no seam, and only the hairline below divides them. On the page's own
 * shade it would read as a bright band wedged between the app bar above it and
 * the workspace below, both of which are darker.
 *
 * `h-11` is the segmented track's own `h-8` plus a 6px gutter above and below,
 * so the track floats in the row instead of touching its edges — the fill needs
 * that air to read as one control rather than as a band. The hairline is an
 * *inset box-shadow*, not a `border-b`, on purpose: a border shrinks the content
 * box (border-box), so the row's children would sit 1px shy of its full height
 * and the centered track would land a half-pixel high. A shadow takes no layout
 * space. Shared so the Suspense fallback (`TabWorkspaceFallback`) matches the
 * bar's size exactly, instead of re-declaring the constant.
 */
export const TAB_BAR_ROW =
  "h-11 shrink-0 bg-(--content) shadow-[inset_0_-1px_0_0_var(--border)]"

export type TabBarProps = {
  tabs: Tab[]
  activeId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onDuplicate: (id: string) => void
  onCloseOthers: (id: string) => void
  onCloseAll: () => void
}

/**
 * The strip's fixed overheads, in px — the partitioner needs them numerically.
 *
 * `CHIP_GAP` is 0 because the default tabs variant butts its triggers together:
 * the track's fill is what separates them, so a gap would only open slots of
 * bare rail between tabs. `TRACK_PADDING` is the track's own `p-[3px]` on both
 * sides, and `MORE_GAP` the `gap-1` between the track and the overflow button
 * that sits outside it — both come off the budget the chips get to fill.
 */
const CHIP_GAP = 0
const STRIP_PADDING = 24
const TRACK_PADDING = 6
const MORE_GAP = 4

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
      setContainerWidth(strip.clientWidth - STRIP_PADDING - TRACK_PADDING)
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
    // The button's own width plus the gap that precedes it — the partitioner
    // charges one `gap` for that space, and ours is 0 between chips.
    moreWidth: moreWidth + MORE_GAP,
    gap: CHIP_GAP,
  })

  return (
    <div className={cn("flex items-center", TAB_BAR_ROW)}>
      {/* `overflow-hidden` guards the measuring commit, where every chip renders
          at once so its width can be read — without it that pass would blow out
          the layout. */}
      <div
        ref={stripRef}
        className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden px-3"
      >
        {/* The segmented track — `TabsList`'s default variant. It sizes to its
            chips (`w-fit` by way of being a flex item), so with two tabs open
            the fill stops after two tabs instead of drawing a rail across the
            whole window. The chips inside are `shrink-0`, so during the
            measuring commit the track simply overruns the strip's hidden
            overflow rather than squeezing the labels it is trying to measure.

            `--tab-track` in place of the variant's `bg-muted`: on this theme
            `--muted` *is* the workspace shade the strip is drawn on, so the
            track vanished in light while showing plainly in dark. The token
            recesses it under the strip in light and lifts it over the strip in
            dark — the same control on both.

            One step down the radius ramp from the variant (`md` here, `sm` on
            the chips): a tab is a wide, squat box, and the radius that suits a
            segmented control's short segments reads as a lozenge at this
            width. The pair still steps together — the track's corner stays
            the chip's plus roughly the 3px between them, so the two curves
            stay concentric rather than one sitting inside a rounder one. */}
        <div className="flex h-8 items-center rounded-md bg-(--tab-track) p-[3px] text-muted-foreground">
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
        </div>
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
 * The overflow button and its list of collapsed tabs. Selecting one focuses it —
 * and because `partitionTabs` pins the active tab, the chosen tab immediately
 * takes a visible slot, so the menu doubles as the way back out of overflow.
 *
 * Deliberately *not* styled as a tab, and deliberately outside the track: a tab
 * is a slot in the segmented fill, so anything sharing that fill reads as one.
 * A ghost button set just past the track's right edge reads instead as "tabs,
 * then a control", which is what it is.
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
            // Stays lit while the menu is open, so the button doesn't look
            // dismissed with its own popup on screen.
            className="group/more flex h-7 shrink-0 items-center gap-1 rounded-sm px-2 text-sm font-medium text-foreground/60 transition-colors duration-150 hover:bg-accent hover:text-foreground data-popup-open:bg-accent data-popup-open:text-foreground dark:text-muted-foreground dark:hover:text-foreground [&_svg]:size-3.5 [&_svg]:shrink-0"
          >
            {/* Count first — it's the part worth scanning, and it's what
                changes as tabs come and go. */}
            <span className="tabular-nums">{tabs.length}</span>
            <span>more</span>
            <ChevronDown
              strokeWidth={1.5}
              className="transition-transform duration-150 group-data-popup-open/more:rotate-180"
            />
          </button>
        }
      />
      {/* `w-auto` is load-bearing: the menu's default is `w-(--anchor-width)`,
          which sizes it to its trigger. That suits a select, but here the
          trigger is a narrow "n more" button, so screen labels would be
          clipped by the very button that hides them. Size to the labels
          instead, with a max so one long name can't stretch the menu across
          the strip — only then does the item's `truncate` come into play. */}
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-auto max-w-72 min-w-44 overflow-y-auto"
      >
        {/* Names what the list is. Without it the menu is a bare run of screen
            names that could just as easily be a launcher — and these are open
            tabs, not screens to open. */}
        <DropdownMenuLabel>Hidden tabs</DropdownMenuLabel>
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
              // Styled as the *default* variant of `components/ui/tabs.tsx`:
              // the active tab is a raised pill lifted out of the muted track,
              // and every other tab is dimmed text on that track. The classes
              // are `TabsTrigger`'s own, transcribed rather than imported
              // because a chip is a context-menu trigger wrapping a nested
              // close button — it can't *be* a `TabsTrigger`, which renders a
              // `<button>` (and buttons don't nest).
              //
              // `h-[calc(100%-1px)]` is the trigger's own height rule: it fills
              // the track's content box bar a hairline, which is what leaves a
              // sliver of rail visible around the active pill.
              "group/tab relative flex h-[calc(100%-1px)] shrink-0 items-center gap-1 rounded-sm border border-transparent px-2 text-sm font-medium whitespace-nowrap transition-all",
              isActive
                ? // `shadow-xs`, not the variant's `shadow-sm`: a tab chip is
                  // wider than a segmented-control segment, so the same shadow
                  // spread over that length reads as the pill floating well off
                  // the strip. The lift only has to say "this one is on top".
                  "bg-background text-foreground shadow-xs dark:border-input dark:bg-input/30"
                : "text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
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
          {/* No ghost-width reservation needed: the variant holds weight at
              medium in both states, so a chip measures the same active or not
              and selecting one can't reflow its neighbors. */}
          <span className="max-w-40 truncate">{label}</span>
        </button>

        {/* Close — the only inline action. Active tabs always show it;
            inactive tabs reveal it on hover, which doubles as their hover
            feedback. Everything else lives in the right-click menu, so there's
            a single, unambiguous target.

            The hover fill is `foreground/10` rather than `accent`: an inactive
            chip sits on the muted track and an active one on the raised pill,
            and a translucent tint of the text color is the one fill that stays
            visible on both. */}
        <button
          type="button"
          onClick={() => onClose(tab.id)}
          aria-label={`Close ${label} tab`}
          className={cn(
            "flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-opacity duration-150 hover:bg-foreground/10 hover:text-foreground [&_svg]:size-3.5",
            isActive ? "opacity-100" : "opacity-0 group-hover/tab:opacity-100"
          )}
        >
          <X strokeWidth={1.5} />
        </button>
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
