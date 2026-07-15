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
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            data-slot="tab-chip"
            data-active={isActive}
            className={cn(
              "group/tab relative flex h-8 shrink-0 items-center gap-1 rounded-md pr-1.5 pl-2.5 text-sm transition-[background-color,color] duration-150",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "font-normal text-muted-foreground hover:bg-muted/50 hover:text-foreground",
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
          <span className="max-w-40 truncate">{label}</span>
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
            isActive ? "opacity-100" : "opacity-0 group-hover/tab:opacity-100",
          )}
        >
          <X strokeWidth={2} />
        </button>

        {/* Active indicator bar. */}
        {isActive && (
          <span className="absolute -bottom-px left-2 right-2 h-px bg-primary" />
        )}
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => onDuplicate(tab.id)}>
          <Copy strokeWidth={2} />
          <span>Duplicate</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onClose(tab.id)}>
          <X strokeWidth={2} />
          <span>Close</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onCloseOthers(tab.id)}>
          <SquareX strokeWidth={2} />
          <span>Close others</span>
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" onClick={onCloseAll}>
          <XCircle strokeWidth={2} />
          <span>Close all</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
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
