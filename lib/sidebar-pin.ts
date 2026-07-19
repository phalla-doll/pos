/**
 * The sidebar pin: the user's standing intent to keep the sidebar open.
 *
 * Nothing opens the sidebar but a deliberate toggle — there is no hover or
 * focus peek — so the pin is simply whether the sidebar is open, persisted.
 * It stays separate from the `open` flag `components/ui/sidebar.tsx` keeps
 * because the provider here runs *controlled*: the vendored cookie records
 * only what the provider was last handed, so driving state from it would mean
 * trusting a value this app never writes.
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
