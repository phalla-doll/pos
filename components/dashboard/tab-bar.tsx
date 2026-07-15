"use client"

import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getScreen } from "@/lib/screens"
import type { Tab } from "@/hooks/use-tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy02Icon,
  Cancel01Icon,
  Cancel02Icon,
  CancelSquareIcon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons"

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
    <div className="flex h-10 items-center border-b bg-background">
      <ScrollArea className="size-full">
        <div className="flex h-10 items-center gap-1 px-2">
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
    <div
      data-slot="tab-chip"
      data-active={isActive}
      className={cn(
        "group/tab relative flex h-8 shrink-0 items-center gap-1 rounded-md pr-2 text-sm font-medium transition-[background-color,color,padding] duration-150",
        isActive
          ? "bg-muted text-foreground pl-2.5"
          : "pl-2.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(tab.id)}
        className="flex h-full items-center gap-1.5 outline-none [&_svg]:size-4 [&_svg]:shrink-0"
      >
        {icon}
        <span className="max-w-40 truncate">{label}</span>
      </button>

      {/* Actions group — collapses to zero width when not hovered/active so
          inactive tabs stay compact (no dead space from invisible buttons). */}
      <div
        className={cn(
          "flex items-center gap-0.5 overflow-hidden transition-[opacity,width] duration-150",
          // Active tab: always show. Inactive: reveal on chip hover.
          isActive
            ? "opacity-100"
            : "w-0 opacity-0 group-hover/tab:w-auto group-hover/tab:opacity-100",
        )}
      >
        {/* Quick close. */}
        <button
          type="button"
          onClick={() => onClose(tab.id)}
          aria-label={`Close ${label} tab`}
          className="flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </button>

        {/* More actions (duplicate / close others / close all). */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label={`More options for ${label} tab`}
                className="flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:opacity-100"
              />
            }
          >
            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" className="w-44">
            <DropdownMenuItem onClick={() => onDuplicate(tab.id)}>
              <HugeiconsIcon icon={Copy02Icon} strokeWidth={2} />
              <span>Duplicate</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClose(tab.id)}>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              <span>Close</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onCloseOthers(tab.id)}>
              <HugeiconsIcon icon={CancelSquareIcon} strokeWidth={2} />
              <span>Close others</span>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onCloseAll}>
              <HugeiconsIcon icon={Cancel02Icon} strokeWidth={2} />
              <span>Close all</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active indicator bar. */}
      {isActive && (
        <span className="absolute -bottom-px left-2 right-2 h-px bg-primary" />
      )}
    </div>
  )
}

/**
 * Empty state shown when there are no open tabs. Renders a centered prompt
 * directing the user to the sidebar.
 */
export function TabBarEmpty() {
  return (
    <div className="flex h-10 items-center border-b bg-background px-4">
      <span className="text-xs text-muted-foreground">No tabs open</span>
    </div>
  )
}
