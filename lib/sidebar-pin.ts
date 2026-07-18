/**
 * The sidebar pin: the user's standing intent to keep the sidebar open.
 *
 * `components/ui/sidebar.tsx` already persists its own `open` flag, but that
 * records the *result* — and with hover-peek the sidebar opens constantly
 * without the user asking for it, so `open` would be overwritten by every
 * passing cursor. The pin is stored separately and is what the provider is
 * driven from; `open` becomes derived, not authoritative.
 *
 * A cookie rather than localStorage, to match how the vendored sidebar already
 * persists. Note it is still read on the *client*: the static-export build
 * (`GITHUB_PAGES`) has no server to read a cookie at request time, and reading
 * one in the layout would make `/dashboard` dynamic and stop it prerendering.
 */

export const PIN_COOKIE_NAME = "sidebar_pinned"

/** One week, matching `SIDEBAR_COOKIE_MAX_AGE` in the vendored sidebar. */
const PIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

/** The `document.cookie` write that persists a pin state. */
export function pinCookie(pinned: boolean): string {
  return `${PIN_COOKIE_NAME}=${pinned}; path=/; max-age=${PIN_COOKIE_MAX_AGE}`
}

/**
 * Reads the pin out of a `document.cookie` string. Anything absent, malformed,
 * or not exactly `true` reads as unpinned — an unreadable cookie should leave
 * the user with the documented default (collapsed), not a coin flip.
 *
 * Matching is on the whole name, so a cookie merely *ending* in the pin's name
 * (`app_sidebar_pinned`) is not mistaken for it.
 */
export function readPinned(cookie: string): boolean {
  return cookie.split(";").some((pair) => {
    const eq = pair.indexOf("=")
    if (eq === -1) return false
    return (
      pair.slice(0, eq).trim() === PIN_COOKIE_NAME &&
      pair.slice(eq + 1).trim() === "true"
    )
  })
}

/**
 * Whether the sidebar renders open. Peeking is what the pin exists to keep out
 * of storage: it opens the sidebar exactly as being pinned does, but only for
 * as long as the pointer is there.
 */
export function sidebarOpen({
  pinned,
  peeking,
}: {
  pinned: boolean
  peeking: boolean
}): boolean {
  return pinned || peeking
}
