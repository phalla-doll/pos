import { describe, expect, it } from "vitest"

import type { ScreenRef } from "@/lib/tab-identity"
import { tabTitle } from "@/lib/tab-title"

// Real registry keys — this module reads the screen registry, so unlike the
// reducer's tests these can't be arbitrary strings.
type ScreenType = ScreenRef["screenType"]
const ref = (screenType: string, param?: string): ScreenRef =>
  param === undefined
    ? { screenType: screenType as ScreenType }
    : { screenType: screenType as ScreenType, param }

describe("tabTitle", () => {
  it("names a plain screen by its registry label", () => {
    expect(tabTitle(ref("inventory"))).toBe("Inventory")
  })

  it("names a draft for the screen it will add to", () => {
    // Not "New item": a chip is read on its own in the overflow menu and as
    // the browser tab's title, where there is no Inventory tab beside it to
    // say which item. The row noun carries the sentences inside the form.
    expect(tabTitle(ref("inventory", "new-a3f9"))).toBe("New Inventory")
  })

  it("lets a screen override a draft label that reads wrong", () => {
    // The default would be "New Customers", which claims to be creating
    // several. The label is plural because the sidebar wants a plural, so the
    // screen declares the singular phrase for this one position.
    expect(tabTitle(ref("customer-listing", "new-a3f9"))).toBe("New customer")
  })

  it("names an existing record by its id", () => {
    // Shorter than "Inventory SKU-0001", and already what the user clicked —
    // the chip truncates, so the useful half has to come first.
    expect(tabTitle(ref("inventory", "SKU-0001"))).toBe("SKU-0001")
  })

  it("ignores a param on a screen that takes none", () => {
    expect(tabTitle(ref("pos", "SKU-0001"))).toBe("POS Screen")
  })

  it("falls back to the raw type for a screen the registry doesn't know", () => {
    expect(tabTitle(ref("lolwut"))).toBe("lolwut")
  })
})
