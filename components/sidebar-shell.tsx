"use client"

import * as React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { SIDEBAR_WIDTH_ICON } from "@/lib/sidebar-metrics"
import { pinCookie, readPinned } from "@/lib/sidebar-pin"

/**
 * Lets `useSyncExternalStore` treat the pin cookie as the store it is. Writes
 * to `document.cookie` fire no event, so the setter announces its own change;
 * nothing else in the app writes this key.
 */
const pinStore = {
  listeners: new Set<() => void>(),
  subscribe(onChange: () => void) {
    pinStore.listeners.add(onChange)
    return () => pinStore.listeners.delete(onChange)
  },
  emit() {
    pinStore.listeners.forEach((l) => l())
  },
}

type SidebarPanel = {
  /** The standing intent to keep the panel open — persisted in the cookie. */
  pinned: boolean
  /** Whether pane 2 is showing at all: `pinned || transientOpen`. */
  open: boolean
  /** Writes the pin cookie. */
  setPinned: (pinned: boolean) => void
  /** Sets the ephemeral "open right now, but not pinned" flag. */
  setTransientOpen: (open: boolean) => void
}

const SidebarPanelContext = React.createContext<SidebarPanel | null>(null)

/** Read by pane 2's Menu and pin controls in the sidebar header. */
export function useSidebarPanel(): SidebarPanel {
  const ctx = React.useContext(SidebarPanelContext)
  if (!ctx) throw new Error("useSidebarPanel must be used within SidebarShell")
  return ctx
}

/**
 * Owns the sidebar's open state, split in two so "open the panel" and "keep it
 * open" are no longer the same act:
 *
 * - **`pinned`** is the standing intent, persisted in the cookie — see
 *   `lib/sidebar-pin.ts` for why it lives outside the vendored provider.
 * - **`transientOpen`** is ephemeral React state: the panel opened by the rail's
 *   Menu button without pinning, which the panel drops again the moment a screen
 *   is selected. It never persists, so a refresh always lands on the pin alone.
 *
 * The provider runs controlled on `open = pinned || transientOpen`. Its own
 * uncontrolled routes (⌘B, the header trigger) mean "toggle the whole thing":
 * opening pins, closing clears both flags. The rail's Menu button and the
 * header's pin button reach past this to `setPinned`/`setTransientOpen` for the
 * finer transient-vs-pinned behavior — see `components/app-sidebar.tsx`.
 *
 * The sidebar only ever moves when asked to. It does not peek open under the
 * pointer or under focus: an expanded sidebar reflows the page, which is too
 * much to hand to a cursor merely passing over the rail.
 */
export function SidebarShell({
  header,
  children,
}: {
  /** The full-width app bar, rendered across the very top above both panes. */
  header: React.ReactNode
  children: React.ReactNode
}) {
  // The cookie *is* the pin, so it is subscribed to rather than copied into
  // React. The prerendered HTML has no cookie in hand, which is exactly the
  // split `getServerSnapshot` exists for: the server renders unpinned and the
  // client reads the real value on hydration, with no effect and no mismatch.
  const pinned = React.useSyncExternalStore(
    pinStore.subscribe,
    () => readPinned(document.cookie),
    () => false
  )
  // Ephemeral, client-only, and initially false — so it matches the unpinned
  // server render and needs no hydration handling of its own.
  const [transientOpen, setTransientOpen] = React.useState(false)
  const open = pinned || transientOpen

  const setPinned = React.useCallback((next: boolean) => {
    document.cookie = pinCookie(next)
    pinStore.emit()
  }, [])

  const value = React.useMemo<SidebarPanel>(
    () => ({ pinned, open, setPinned, setTransientOpen }),
    [pinned, open, setPinned]
  )

  return (
    <SidebarPanelContext.Provider value={value}>
      <SidebarProvider
        open={open}
        // Upstream computes the requested value as `!open`, so this fires with
        // the intent already resolved: a request to open is a pin, a request to
        // close clears both flags. The Menu/pin buttons handle the transient
        // middle ground themselves rather than routing through here.
        onOpenChange={(next) => {
          setPinned(next)
          if (!next) setTransientOpen(false)
        }}
        // Open-but-unpinned = overlay: the panel floats over the page rather
        // than reflowing it. `app/globals.css` reads this off the wrapper to
        // hold the layout gap at the rail width while the panel is up. Pinning
        // clears it, so a pinned panel pushes the content as before.
        data-panel-overlay={open && !pinned ? "true" : undefined}
        // A column: the full-width app bar on top, then the sidebar + content
        // row beneath it. `--header-height` is the app bar's height and the
        // offset the fixed sidebar starts at (see `components/app-sidebar.tsx`).
        className="h-svh flex-col overflow-hidden"
        // The expanded sidebar is the icon rail plus the detail panel, so it
        // runs wider than a one-column sidebar. `--sidebar-width-icon` is the
        // rail alone — the width the whole thing collapses to.
        style={
          {
            "--sidebar-width": "19rem",
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            "--header-height": "3rem",
          } as React.CSSProperties
        }
      >
        {header}
        <div className="flex min-h-0 flex-1">
          <AppSidebar />
          {children}
        </div>
      </SidebarProvider>
    </SidebarPanelContext.Provider>
  )
}
