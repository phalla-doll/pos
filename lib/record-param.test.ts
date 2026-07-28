import { describe, expect, it } from "vitest"

import {
  deleteParam,
  draftParam,
  paramKind,
  recordId,
} from "@/lib/record-param"

/** A deterministic mint so cases stay free of randomness. */
function minter(prefix = "tok") {
  let n = 0
  return () => `${prefix}${++n}`
}

describe("draftParam", () => {
  it("marks the param as a draft", () => {
    expect(paramKind(draftParam(minter()))).toBe("draft")
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

describe("deleteParam", () => {
  it("marks the param as a deletion", () => {
    expect(paramKind(deleteParam("SKU-0001"))).toBe("delete")
  })

  it("is the same every time, unlike a draft", () => {
    // The counterpart to the case above, and the reason the two differ: a
    // second Delete on one row has to land on the tab already open for it.
    expect(deleteParam("SKU-0001")).toBe(deleteParam("SKU-0001"))
  })

  it("does not collide with the plain record param", () => {
    // What lets an edit tab and a delete tab for one record coexist: the
    // workspace matches on the ref, so these must not be the same string.
    expect(deleteParam("SKU-0001")).not.toBe("SKU-0001")
  })
})

describe("paramKind", () => {
  it.each([
    ["SKU-0001", "record"],
    ["new-a3f9", "draft"],
    ["delete-SKU-0001", "delete"],
    // The trailing hyphen in each prefix is what keeps these apart from a
    // record whose id is literally the bare word.
    ["new", "record"],
    ["delete", "record"],
    // …and a bare prefix with nothing after it names no record at all, so it
    // is not the kind it looks like either.
    ["new-", "record"],
    ["delete-", "record"],
    // Merely starting with the letters is not carrying the prefix.
    ["newton", "record"],
    ["deleted", "record"],
  ])("reads %o as %o", (param, kind) => {
    expect(paramKind(param)).toBe(kind)
  })
})

describe("recordId", () => {
  it("answers the id for an existing record", () => {
    expect(recordId("SKU-0001")).toBe("SKU-0001")
  })

  it("answers null for a draft, which has nothing to load", () => {
    expect(recordId(draftParam(minter()))).toBeNull()
  })

  it("answers the id underneath a deletion", () => {
    // A delete tab has to show the record before removing it, so it loads the
    // same row an edit tab would.
    expect(recordId(deleteParam("SKU-0001"))).toBe("SKU-0001")
  })

  it("round-trips an id containing hyphens", () => {
    // Only the prefix is stripped, not every hyphen — the ids in this app are
    // full of them.
    expect(recordId(deleteParam("CUST-2024-0007"))).toBe("CUST-2024-0007")
  })
})
