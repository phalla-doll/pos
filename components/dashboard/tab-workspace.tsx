"use client"

import * as React from "react"

import { TabBar, TAB_BAR_ROW } from "@/components/dashboard/tab-bar"
import { MetaKey } from "@/components/header-search"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useTabs } from "@/hooks/use-tabs"
import { getScreen, screens, type ScreenType } from "@/lib/screens"
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
    openTab,
  } = useTabs()

  const activeTab = tabs.find((t) => t.id === activeId) ?? null
  const activeScreen = activeTab ? getScreen(activeTab.screenType) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {tabs.length > 0 && (
        <TabBar
          tabs={tabs}
          activeId={activeId}
          onSelect={setActive}
          onClose={closeTab}
          onDuplicate={duplicateTab}
          onCloseOthers={closeOthers}
          onCloseAll={closeAll}
        />
      )}

      {activeScreen ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-zinc-50 dark:bg-zinc-900">
          {/*
            keying on the tab id guarantees a fresh remount whenever the
            user switches tabs (or duplicates) — per the fresh-remount rule.
          */}
          <activeScreen.component key={activeTab!.id} />
        </div>
      ) : (
        <EmptyState onOpen={openTab} />
      )}
    </div>
  )
}

/**
 * The screens offered as one-click shortcuts on the empty state — the handful
 * a user is most likely to want first. Curation only: every label, icon, and
 * description still comes from the registry, so this stays a list of *keys*
 * and a renamed or removed screen fails to typecheck rather than drifting.
 */
const QUICK_START: readonly ScreenType[] = [
  "dashboard",
  "pos",
  "inventory",
  "customer-listing",
]

/**
 * Shown when no tab is active (no tabs open, or the active tab was closed
 * without a neighbor to focus). Beyond explaining the state, it doubles as a
 * launcher: the workspace owns `openTab`, so the shortcuts here can open a
 * screen directly instead of sending the user back to the sidebar.
 */
function EmptyState({ onOpen }: { onOpen: (screenType: ScreenType) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-zinc-50 dark:bg-zinc-900">
      <Empty className="p-8">
        <EmptyHeader>
          <EmptyMedia>
            {/* A soft ring around the glyph, so the icon reads as a deliberate
                mark rather than a stray disabled control. */}
            <div className="flex size-14 items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-xs ring-1 ring-border">
              <LayoutDashboard strokeWidth={1.5} className="size-6" />
            </div>
          </EmptyMedia>
          <EmptyTitle className="text-base">No screen open</EmptyTitle>
          <EmptyDescription>
            Jump into one of these, or open any screen from the sidebar.
          </EmptyDescription>
        </EmptyHeader>

        <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
          {QUICK_START.map((type) => {
            const screen = screens[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() => onOpen(type)}
                className="group flex items-start gap-3 rounded-xl border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary [&_svg]:size-4">
                  {screen.icon}
                </span>
                <span className="min-w-0 space-y-0.5">
                  <span className="block text-sm font-medium">
                    {screen.label}
                  </span>
                  <span className="line-clamp-2 block text-xs text-muted-foreground">
                    {screen.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Search every screen with
          <KbdGroup>
            <Kbd>
              <MetaKey />
            </Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </p>
      </Empty>
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
      <div className={TAB_BAR_ROW} />
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  )
}
