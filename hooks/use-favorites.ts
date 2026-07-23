"use client"

import * as React from "react"

import {
  parseFavorites,
  serializeFavorites,
  toggleFavorite,
} from "@/lib/favorites"
import { screenKeys, type ScreenType } from "@/lib/screens"

/**
 * The favorites store: which screens the user has starred, persisted in
 * localStorage and shared across every component that reads it (the marking
 * stars in the menu list, the Favorites panel, the rail button).
 *
 * A module-level external store rather than context, so any component can read
 * or toggle favorites without a provider threading it through — the same shape
 * `sidebar-shell.tsx` uses for the pin, but keyed by a whole set instead of one
 * boolean. localStorage rather than a cookie: it is a client-only concern (the
 * static-export build has no server to read it), it never needs to ride along
 * on a request, and a small set is a natural fit.
 *
 * The read is memoized on the raw string so `getSnapshot` returns a stable
 * reference between actual changes — the invariant `useSyncExternalStore`
 * requires to avoid an infinite render loop.
 */

const STORAGE_KEY = "pos_favorites"

const listeners = new Set<() => void>()

// The prerender and the first client render share this one empty array, so the
// server snapshot is referentially stable and hydration sees no change until a
// real value is read on the client.
const EMPTY: ScreenType[] = []

let cachedRaw: string | null = null
let cachedList: ScreenType[] = EMPTY

/** Read (and validate) the current favorites, memoized on the stored string. */
function readList(): ScreenType[] {
  if (typeof window === "undefined") return EMPTY
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? ""
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedList = parseFavorites(raw, screenKeys)
  }
  return cachedList
}

function emit() {
  listeners.forEach((l) => l())
}

// Another tab writing the key fires `storage` here (never in the writing tab),
// so re-reading picks up the change and notifies our own subscribers.
function onStorage(e: StorageEvent) {
  if (e.key === STORAGE_KEY) emit()
}

function subscribe(onChange: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage)
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) window.removeEventListener("storage", onStorage)
  }
}

/** Persist a new favorites list and announce the change to this tab. */
function write(next: ScreenType[]) {
  const raw = serializeFavorites(next)
  window.localStorage.setItem(STORAGE_KEY, raw)
  // Prime the cache so the very next read returns `next` (a same-tab write
  // fires no `storage` event, so nothing else refreshes it).
  cachedRaw = raw
  cachedList = next
  emit()
}

/**
 * Read the favorites and toggle them. `favorites` is the ordered list;
 * `isFavorite` and `toggle` are the membership operations, both stable across
 * renders so they can sit in dependency arrays freely.
 */
export function useFavorites(): {
  favorites: ScreenType[]
  isFavorite: (type: ScreenType) => boolean
  toggle: (type: ScreenType) => void
} {
  const favorites = React.useSyncExternalStore(subscribe, readList, () => EMPTY)
  const set = React.useMemo(() => new Set(favorites), [favorites])
  const isFavorite = React.useCallback(
    (type: ScreenType) => set.has(type),
    [set]
  )
  const toggle = React.useCallback((type: ScreenType) => {
    write(toggleFavorite(readList(), type))
  }, [])
  return { favorites, isFavorite, toggle }
}
