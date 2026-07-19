"use client"

import * as React from "react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getScreen } from "@/lib/screens"
import type { Tab } from "@/hooks/use-tabs"
import { Copy, X, XCircle, SquareX } from "lucide-react"

/**
 * Height + bottom edge of the tab-bar row. The strip itself is transparent
 * (`background`); contrast comes from a bottom hairline, which the active tab
 * punches through — its fill + flared corners erase the line beneath it, so it
 * reads as connected to the content below, browser-tab style. The hairline is
 * an *inset box-shadow*, not a `border-b`, on purpose: a border shrinks the
 * content box (border-box), leaving the horizontal ScrollArea's viewport 1px
 * shorter than the strip and forcing a stray vertical scrollbar. A shadow
 * takes no layout space, so the viewport fills the strip exactly, and the
 * active tab's background simply paints over the inset line — no `-mb-px`
 * overflow needed. Shared so the Suspense fallback (`TabWorkspaceFallback`)
 * matches the bar's size exactly, instead of re-declaring the constant.
 */
export const TAB_BAR_ROW =
  "h-10 shrink-0 bg-background shadow-[inset_0_-1px_0_0_var(--border)]"

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
 * Horizontal strip of open tabs. Each tab shows the screen's icon + label,
 * a hover-revealed "more" button for tab actions, and a close affordance.
 * Overflows horizontally via ScrollArea.
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
  return (
    <div className={cn("flex items-end", TAB_BAR_ROW)}>
      <ScrollArea className="size-full">
        {/* Tabs sit flush to the bottom of the strip so the active tab's
            flared corners can merge into the content area beneath. */}
        <div className="flex h-10 items-end gap-1 px-2">
          {tabs.map((tab) => (
            <TabChip
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeId}
              onSelect={onSelect}
              onClose={onClose}
              onDuplicate={onDuplicate}
              onCloseOthers={onCloseOthers}
              onCloseAll={onCloseAll}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

type TabChipProps = {
  tab: Tab
  isActive: boolean
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onDuplicate: (id: string) => void
  onCloseOthers: (id: string) => void
  onCloseAll: () => void
}

function TabChip({
  tab,
  isActive,
  onSelect,
  onClose,
  onDuplicate,
  onCloseOthers,
  onCloseAll,
}: TabChipProps) {
  const screen = getScreen(tab.screenType)
  const label = screen?.label ?? tab.screenType
  const icon = screen?.icon

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
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
                ? "h-9 bg-[var(--tab-active)] font-medium text-foreground"
                : "h-9 font-normal text-muted-foreground hover:text-foreground"
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
