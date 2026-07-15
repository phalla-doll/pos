"use client"

import * as React from "react"

import { TabBar, TabBarEmpty } from "@/components/dashboard/tab-bar"
import { useTabs } from "@/hooks/use-tabs"
import { getScreen } from "@/lib/screens"
import { LayoutDashboard } from "lucide-react"

/**
 * The tabbed workspace. Owns tab state via {@link useTabs}, renders the
 * tab bar, and renders the active screen's content with a `key` derived
 * from the active tab id — so every tab switch is a fresh remount.
 *
 * Uses `useSearchParams` (via the hook), so it must be wrapped in a
 * `<Suspense>` boundary by its parent.
 */
export function TabWorkspace() {
  const {
    tabs,
    activeId,
    setActive,
    closeTab,
    duplicateTab,
    closeOthers,
    closeAll,
  } = useTabs()

  const activeTab = tabs.find((t) => t.id === activeId) ?? null
  const activeScreen = activeTab ? getScreen(activeTab.screenType) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {tabs.length > 0 ? (
        <TabBar
          tabs={tabs}
          activeId={activeId}
          onSelect={setActive}
          onClose={closeTab}
          onDuplicate={duplicateTab}
          onCloseOthers={closeOthers}
          onCloseAll={closeAll}
        />
      ) : (
        <TabBarEmpty />
      )}

      {activeScreen ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          {/*
            keying on the tab id guarantees a fresh remount whenever the
            user switches tabs (or duplicates) — per the fresh-remount rule.
          */}
          <activeScreen.component key={activeTab!.id} />
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

/**
 * Shown when no tab is active (no tabs open, or the active tab was closed
 * without a neighbor to focus). Prompts the user to open a screen.
 */
function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <LayoutDashboard
        strokeWidth={1.5}
        className="size-10 text-muted-foreground/50"
      />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">No screen open</p>
        <p className="text-sm text-muted-foreground">
          Open a screen from the sidebar to get started.
        </p>
      </div>
    </div>
  )
}

/**
 * Suspense fallback for the workspace. Matches the tab bar height so the
 * layout doesn't jump while `useSearchParams` resolves.
 */
export function TabWorkspaceFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="h-10 border-b bg-background" />
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  )
}
