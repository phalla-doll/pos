"use client"

import * as React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { SIDEBAR_WIDTH_ICON, peekOverlay } from "@/lib/sidebar-metrics"
import { pinCookie, readPinned, sidebarOpen } from "@/lib/sidebar-pin"

/** What a peeking shell exposes to the rest of the layout, as a data attribute
 * on the wrapper — the header reads it to hold its height. A bare attribute
 * would be `data-peek=""`, which Tailwind's `data-[peek]` matches. */
const PEEK_ATTR = "data-peek"

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
 * controlled: `open` is derived from pin + peek, and every uncontrolled path
 * into it (the header trigger, ⌘B) lands on `setPinned`, so toggling the
 * sidebar by any route is what "pin" means.
 *
 * Unpinned, the sidebar rests collapsed and peeks open while the pointer is
 * over it. The peek deliberately does not touch the cookie: hovering past the
 * rail is not a preference.
 */
export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [peeking, setPeeking] = React.useState(false)

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
    // Pinning while peeking would otherwise leave the peek latched on, so
    // that a later pointer-leave would close a sidebar the user just pinned.
    if (next) setPeeking(false)
  }, [])

  const open = sidebarOpen({ pinned, peeking })
  const isPeek = peeking && !pinned

  return (
    <PinContext.Provider value={{ pinned, setPinned }}>
      <SidebarProvider
        open={open}
        onOpenChange={setPinned}
        className={cn("h-svh overflow-hidden", isPeek && peekOverlay)}
        style={
          { "--sidebar-width-icon": SIDEBAR_WIDTH_ICON } as React.CSSProperties
        }
        {...{ [PEEK_ATTR]: isPeek ? "" : undefined }}
      >
        <AppSidebar
          onMouseEnter={() => setPeeking(true)}
          onMouseLeave={() => setPeeking(false)}
        />
        {children}
      </SidebarProvider>
    </PinContext.Provider>
  )
}
