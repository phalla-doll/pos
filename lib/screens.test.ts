import { describe, expect, it } from "vitest"

import { draftParam } from "@/lib/record-param"
import { screenKeys, screens, type Screen } from "@/lib/screens"

/**
 * Contract checks over the registry itself, in the spirit of `nav.test.ts`:
 * the registry is the single source the tab bar, URL codec, and record forms
 * all read, so the properties they rely on are asserted here once rather than
 * re-derived at each consumer.
 *
 * These iterate the whole registry, so a screen added later is covered without
 * anyone remembering to add a case.
 */

const withDetail = screenKeys
  .map((type) => screens[type])
  .filter(
    (screen): screen is Screen & { detail: NonNullable<Screen["detail"]> } =>
      Boolean(screen.detail)
  )

/** A draft token, minted the way `openDraft` does. */
const aDraft = draftParam(() => "test1")

describe("the registry's screen definitions", () => {
  it("has at least one screen offering a record form", () => {
    // Guards the suite itself: every case below iterates `withDetail`, so an
    // empty list would make them all pass vacuously.
    expect(withDetail.length).toBeGreaterThan(0)
  })

  it.each(screenKeys)("%s declares its own key as its type", (type) => {
    expect(screens[type].type).toBe(type)
  })

  it.each(screenKeys)("%s has a non-empty label and description", (type) => {
    expect(screens[type].label.trim()).not.toBe("")
    expect(screens[type].description.trim()).not.toBe("")
  })
})

describe("a screen's record-form contract", () => {
  it.each(withDetail)(
    "$type names a draft without leaving it blank",
    (screen) => {
      // The chip, the overflow menu, and the browser tab title all render this.
      expect(screen.detail.label(aDraft).trim()).not.toBe("")
    }
  )

  it.each(withDetail)("$type does not name a draft in the plural", (screen) => {
    // The failure this exists to catch: the default `New ${label}` over a
    // plural label produced "New Customers", which claims to be creating
    // several. Such a screen has to declare a `draftLabel`.
    //
    // Deliberately narrow. Asserting the phrase itself doesn't end in "s"
    // would fail a screen whose singular legitimately does — "New address",
    // "New business" — so this fires only when the *screen label* is plural,
    // and then forbids only using it verbatim. Whether the replacement reads
    // well is a judgement no assertion can make; `tab-title.test.ts` pins the
    // exact strings for the screens that exist.
    if (!screen.label.endsWith("s")) return
    expect(screen.detail.label(aDraft)).not.toBe(`New ${screen.label}`)
  })

  it.each(withDetail)("$type names a record by its own id", (screen) => {
    // Not prefixed with the screen: the chip truncates, so the id has to lead.
    expect(screen.detail.label("SKU-0001")).toBe("SKU-0001")
  })

  it.each(withDetail)("$type tells a draft apart from a record", (screen) => {
    expect(screen.detail.label(aDraft)).not.toBe(
      screen.detail.label("SKU-0001")
    )
  })

  it.each(withDetail)("$type rejects a record that doesn't exist", (screen) => {
    // `accepts` runs in the URL codec before a token becomes a tab, so this is
    // what stops a stale link opening a form over nothing.
    expect(screen.detail.accepts("definitely-not-a-real-row-key")).toBe(false)
  })

  it.each(withDetail)("$type accepts a freshly minted draft", (screen) => {
    expect(screen.detail.accepts(aDraft)).toBe(true)
  })

  it.each(withDetail)("$type rejects an empty param", (screen) => {
    expect(screen.detail.accepts("")).toBe(false)
  })
})

describe("screens without a record form", () => {
  it("declare no detail at all rather than an inert one", () => {
    // The URL codec branches on `detail` being absent to decide that a param
    // is meaningless (and drops it, keeping the bare screen). An empty-but-
    // present detail would send it down the validation path instead.
    expect(screens.pos.detail).toBeUndefined()
    expect(screens.dashboard.detail).toBeUndefined()
  })
})
