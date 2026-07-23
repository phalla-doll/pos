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

type PinContext = { pinned: boolean; setPinned: (pinned: boolean) => void }

const PinContext = React.createContext<PinContext | null>(null)

/** Read by the pin button in the sidebar header. */
export function useSidebarPin(): PinContext {
  const ctx = React.useContext(PinContext)
  if (!ctx) throw new Error("useSidebarPin must be used within SidebarShell")
  return ctx
}

/**
 * Owns the sidebar's open state so the pin, not the vendored provider, is the
 * thing that persists — see `lib/sidebar-pin.ts` for why. The provider runs
 * controlled: `open` *is* the pin, and every uncontrolled path into it (the
 * header trigger, ⌘B, the rail, the footer's expand button) lands on
 * `setPinned`, so toggling the sidebar by any route is what "pin" means.
 *
 * The sidebar only ever moves when asked to. It does not peek open under the
 * pointer or under focus: an expanded sidebar reflows the page, which is too
 * much to hand to a cursor merely passing over the rail.
 */
export function SidebarShell({ children }: { children: React.ReactNode }) {
  // The cookie *is* the state, so it is subscribed to rather than copied into
  // React. The prerendered HTML has no cookie in hand, which is exactly the
  // split `getServerSnapshot` exists for: the server renders unpinned and the
  // client reads the real value on hydration, with no effect and no mismatch.
  const pinned = React.useSyncExternalStore(
    pinStore.subscribe,
    () => readPinned(document.cookie),
    () => false
  )

  const setPinned = React.useCallback((next: boolean) => {
    document.cookie = pinCookie(next)
    pinStore.emit()
  }, [])

  return (
    <PinContext.Provider value={{ pinned, setPinned }}>
      <SidebarProvider
        open={pinned}
        // Upstream computes the requested value as `!open`, which is the pin
        // inverted — so taking it or inverting the pin ourselves are the same
        // thing. Written this way it stays correct against a `setOpen(true)`
        // caller that means "open", not "toggle".
        onOpenChange={(next) => setPinned(next)}
        className="h-svh overflow-hidden"
        // The expanded sidebar is the icon rail plus the detail panel, so it
        // runs wider than a one-column sidebar. `--sidebar-width-icon` is the
        // rail alone — the width the whole thing collapses to.
        style={
          {
            "--sidebar-width": "19rem",
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        {children}
      </SidebarProvider>
    </PinContext.Provider>
  )
}
