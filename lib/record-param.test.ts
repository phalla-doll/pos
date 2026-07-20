import { describe, expect, it } from "vitest"

import { draftParam, isDraft, recordId } from "@/lib/record-param"

/** A deterministic mint so cases stay free of randomness. */
function minter(prefix = "tok") {
  let n = 0
  return () => `${prefix}${++n}`
}

describe("draftParam", () => {
  it("marks the param as a draft", () => {
    expect(isDraft(draftParam(minter()))).toBe(true)
  })

  it("is different every time", () => {
    // The whole reason drafts get a minted token: two New clicks must produce
    // two refs that can't match each other, or the second would reuse the
    // first's tab instead of opening its own.
    const mint = minter()
    const params = [draftParam(mint), draftParam(mint), draftParam(mint)]
    expect(new Set(params).size).toBe(3)
  })
})

describe("isDraft", () => {
  it("rejects an ordinary record id", () => {
    expect(isDraft("SKU-0001")).toBe(false)
  })

  it("rejects a record whose id is literally 'new'", () => {
    // The trailing hyphen in the prefix is what keeps these apart.
    expect(isDraft("new")).toBe(false)
  })

  it("rejects the bare prefix with nothing after it", () => {
    expect(isDraft("new-")).toBe(false)
  })

  it("accepts a record id that merely starts with 'new'", () => {
    expect(isDraft("newton")).toBe(false)
  })
})

describe("recordId", () => {
  it("answers the id for an existing record", () => {
    expect(recordId("SKU-0001")).toBe("SKU-0001")
  })

  it("answers null for a draft, which has nothing to load", () => {
    expect(recordId(draftParam(minter()))).toBeNull()
  })
})
