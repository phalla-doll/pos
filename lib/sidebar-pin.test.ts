import { describe, expect, it } from "vitest"

import { PIN_COOKIE_NAME, pinCookie, readPinned } from "./sidebar-pin"

describe("readPinned", () => {
  const cases: [name: string, cookie: string, expected: boolean][] = [
    ["empty cookie", "", false],
    ["absent", "theme=dark; sidebar_state=true", false],
    ["pinned", `${PIN_COOKIE_NAME}=true`, true],
    ["unpinned", `${PIN_COOKIE_NAME}=false`, false],
    ["among others", `theme=dark; ${PIN_COOKIE_NAME}=true; a=b`, true],
    ["padded with spaces", ` ${PIN_COOKIE_NAME} = true `, true],
    // The vendored sidebar's own cookie is a different key with the same
    // shape of value; it must not be mistaken for the pin.
    ["vendored sidebar_state only", "sidebar_state=true", false],
    // Name matching is on the whole name, not a suffix.
    ["name is a suffix of another", `app_${PIN_COOKIE_NAME}=true`, false],
    ["malformed pair", `${PIN_COOKIE_NAME}`, false],
    ["non-boolean value", `${PIN_COOKIE_NAME}=yes`, false],
  ]

  it.each(cases)("%s", (_name, cookie, expected) => {
    expect(readPinned(cookie)).toBe(expected)
  })
})

describe("pinCookie", () => {
  it("round-trips through readPinned", () => {
    expect(readPinned(pinCookie(true))).toBe(true)
    expect(readPinned(pinCookie(false))).toBe(false)
  })

  it("scopes the cookie to the whole site and gives it a lifetime", () => {
    expect(pinCookie(true)).toContain("path=/")
    expect(pinCookie(true)).toMatch(/max-age=\d+/)
  })
})
