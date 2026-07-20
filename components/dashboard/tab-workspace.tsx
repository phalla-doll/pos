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
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useTabs, type Tab } from "@/hooks/use-tabs"
import { WorkspaceProvider } from "@/hooks/use-workspace"
import { getScreen, screens, type ScreenType } from "@/lib/screens"
import { tabTitle } from "@/lib/tab-title"
import { workspaceTitle } from "@/lib/title"
import { cn } from "@/lib/utils"

/**
 * The tabbed workspace. Owns tab state via {@link useTabs}, renders the
 * tab bar, and renders the active screen's content with a `key` derived
 * from the active tab id — so every tab switch is a fresh remount.
 *
 * Uses `useSearchParams` (via the hook), so it must be wrapped in a
 * `<Suspense>` boundary by its parent.
 */
export function TabWorkspace() {
  const api = useTabs()
  const {
    tabs,
    activeId,
    setActive,
    closeTab,
    duplicateTab,
    closeOthers,
    closeAll,
    openTab,
  } = api

  const activeTab = tabs.find((t) => t.id === activeId) ?? null

  // The browser tab follows the workspace tab. Switching screens is a shallow
  // URL write, not a navigation, so Next's metadata never re-runs — the label
  // comes off the registry entry, same as the tab bar and screen header.
  useDocumentTitle(workspaceTitle(activeTab ? tabTitle(activeTab) : undefined))

  return (
    <WorkspaceProvider value={api}>
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

        {/*
          Every open tab is mounted; the inactive ones are hidden.

          This is the rule that makes "open the record in a new tab" worth
          doing. Mounting only the active screen meant switching to a form
          unmounted the list behind it, so coming back reset its filters, sort,
          page, and selection — the user lost their place in the very list they
          were editing from. Keeping the mount alive costs a hidden subtree per
          open tab and buys back "the list is still where I left it" for every
          screen at once, without any of them having to save state anywhere.

          `key={tab.id}` still holds, and still means what it did: identity is
          per tab, so a duplicate is a genuinely separate mount and an unrelated
          close can't disturb the tab being looked at. What changed is only that
          a mount now survives being switched away from.

          Hidden with a class rather than the `hidden` attribute — the parent is
          a flex container, and `display: flex` from the layout classes would
          override the attribute's `display: none`.
        */}
        {tabs.length > 0 ? (
          tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-auto bg-zinc-50 dark:bg-zinc-900",
                tab.id !== activeId && "hidden"
              )}
            >
              <ScreenContent tab={tab} />
            </div>
          ))
        ) : (
          <EmptyState onOpen={(screenType) => openTab({ screenType })} />
        )}
      </div>
    </WorkspaceProvider>
  )
}

/**
 * One tab's screen: the registry's `component`, or its `detail.component` when
 * the tab is narrowed to a record.
 *
 * The dispatch lives here rather than inline so the two branches can each be
 * given exactly the props they take — a detail component needs the `param`,
 * the plain one has no such field, and a single element with an optional prop
 * would have to lie about one of them.
 */
function ScreenContent({ tab }: { tab: Tab }) {
  const screen = getScreen(tab.screenType)
  if (!screen) return null

  if (tab.param !== undefined && screen.detail) {
    return (
      <screen.detail.component
        screenType={tab.screenType}
        tabId={tab.id}
        param={tab.param}
      />
    )
  }
  return <screen.component screenType={tab.screenType} tabId={tab.id} />
}

/**
 * One card in the {@link WorkspaceSketch} — a wireframe of the screen layout
 * this workspace shows: header row, body lines, footer row.
 *
 * The bars are `Skeleton` with its pulse removed. This is a decorative
 * illustration of an *empty* workspace, not a loading placeholder, and a
 * pulsing graphic behind "No screen open" would read as "still loading".
 */
function SketchCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "w-64 shrink-0 space-y-3 rounded-xl border bg-background p-3",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="size-7 animate-none rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-2 w-1/2 animate-none" />
          <Skeleton className="h-2 w-3/4 animate-none" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-2 w-full animate-none" />
        <Skeleton className="h-2 w-4/5 animate-none" />
      </div>
      <div className="flex items-center gap-2 border-t pt-3">
        <Skeleton className="h-2 flex-1 animate-none" />
        <Skeleton className="size-5 animate-none" />
        <Skeleton className="size-5 animate-none" />
      </div>
    </div>
  )
}

/**
 * The decorative graphic above the empty-state copy: three wireframe cards,
 * the middle one crisp and lifted, the flanking two blurred and pushed back so
 * the row reads as a workspace continuing past the frame.
 *
 * The flanks are faded by a mask rather than plain opacity — a gradient on
 * both axes (composited to their intersection) dissolves them into the
 * background instead of ending at a visible edge.
 */
function WorkspaceSketch() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative flex w-full max-w-2xl items-center justify-center select-none"
    >
      {/*
        The flanks live in their own masked layer so the fade applies only to
        them — masking the whole row would dissolve the crisp middle card too.
      */}
      <div className="absolute inset-0 flex items-center justify-between [mask-image:linear-gradient(to_right,transparent,black_35%,black_65%,transparent),linear-gradient(to_bottom,black_70%,transparent)] [mask-composite:intersect]">
        <SketchCard className="scale-90 shadow-sm blur-[1px]" />
        <SketchCard className="scale-90 shadow-sm blur-[1px]" />
      </div>
      {/* Extra vertical padding, not a scale-up: it lifts the middle card past
          the flanks without softening its edges the way a transform would.
          The shadow is wide and faint rather than dark — enough to separate it
          from the flanks behind it without weighing down a background graphic. */}
      <SketchCard className="relative z-10 py-5 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.12)]" />
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
        {/* Sits outside `EmptyHeader`, which caps its children at `max-w-sm` —
            the sketch needs the full width for its flanking cards to show. */}
        <WorkspaceSketch />

        <EmptyHeader>
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
