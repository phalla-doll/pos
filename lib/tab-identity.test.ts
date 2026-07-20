import { describe, expect, it } from "vitest"

import {
  refKey,
  reconcileIds,
  type ScreenRef,
  type Tab,
} from "@/lib/tab-identity"

// Screen types are cast because reconcileIds never inspects them — it only
// compares them for equality.
type ScreenType = Tab["screenType"]

function tabs(entries: Array<[id: string, screenType: string]>): Tab[] {
  return entries.map(([id, screenType]) => ({
    id,
    screenType: screenType as ScreenType,
  }))
}

/** Bare screen refs — the shape a paramless tab takes. */
function types(list: string[]): ScreenRef[] {
  return list.map((screenType) => ({ screenType: screenType as ScreenType }))
}

/** `"inventory:SKU-1"` → a ref, so record cases read as they do in the URL. */
function refs(list: string[]): ScreenRef[] {
  return list.map((token) => {
    const [screenType, param] = token.split(":")
    return param === undefined
      ? { screenType: screenType as ScreenType }
      : { screenType: screenType as ScreenType, param }
  })
}

/** A deterministic `mint` so cases stay free of randomness. */
function minter(prefix = "new") {
  let n = 0
  return () => `${prefix}${++n}`
}

describe("reconcileIds", () => {
  it("mints ids for a first render", () => {
    const next = reconcileIds([], types(["dashboard", "inventory"]), minter())
    expect(next).toEqual(
      tabs([
        ["new1", "dashboard"],
        ["new2", "inventory"],
      ])
    )
  })

  it("preserves ids when a tab is appended", () => {
    const prev = tabs([["a", "dashboard"]])
    const next = reconcileIds(prev, types(["dashboard", "inventory"]), minter())
    expect(next.map((t) => t.id)).toEqual(["a", "new1"])
  })

  it("preserves the survivors' ids when a tab is closed", () => {
    const prev = tabs([
      ["a", "dashboard"],
      ["b", "inventory"],
      ["c", "reports"],
    ])
    const next = reconcileIds(prev, types(["dashboard", "reports"]), minter())
    // 'inventory' left; the others keep their ids despite 'reports' shifting.
    expect(next.map((t) => t.id)).toEqual(["a", "c"])
  })

  it("reuses the source id and mints once when a tab is duplicated", () => {
    const prev = tabs([
      ["a", "orders"],
      ["b", "inventory"],
    ])
    const next = reconcileIds(
      prev,
      types(["orders", "orders", "inventory"]),
      minter()
    )
    expect(next.map((t) => t.id)).toEqual(["a", "new1", "b"])
  })

  it("lets ids follow their screen through a reorder", () => {
    const prev = tabs([
      ["a", "dashboard"],
      ["b", "inventory"],
    ])
    const next = reconcileIds(prev, types(["inventory", "dashboard"]), minter())
    expect(next.map((t) => t.id)).toEqual(["b", "a"])
  })

  it("mints fresh ids for screens that weren't open", () => {
    const prev = tabs([["a", "dashboard"]])
    const next = reconcileIds(prev, types(["inventory", "reports"]), minter())
    expect(next.map((t) => t.id)).toEqual(["new1", "new2"])
  })

  it("collapses onto the first id when the first of two identical tabs closes", () => {
    // The documented tradeoff of a URL-authoritative workspace: `?tabs=orders,
    // orders` can't tell the two apart, so the survivor takes the first id and
    // remounts. Pinned here so the behavior is a decision, not a surprise.
    const prev = tabs([
      ["a", "orders"],
      ["b", "orders"],
    ])
    const next = reconcileIds(prev, types(["orders"]), minter())
    expect(next.map((t) => t.id)).toEqual(["a"])
  })

  it("returns the same reference when nothing changed", () => {
    const prev = tabs([
      ["a", "dashboard"],
      ["b", "inventory"],
    ])
    expect(
      reconcileIds(prev, types(["dashboard", "inventory"]), minter())
    ).toBe(prev)
  })

  it("is idempotent — reconciling its own output is a no-op", () => {
    const once = reconcileIds([], types(["orders", "orders"]), minter())
    const twice = reconcileIds(once, types(["orders", "orders"]), minter("x"))
    expect(twice).toBe(once)
  })

  it("empties to no tabs when the URL has none", () => {
    const prev = tabs([["a", "dashboard"]])
    expect(reconcileIds(prev, types([]), minter())).toEqual([])
  })

  it("keeps two records of one screen apart", () => {
    // The reason matching is on the whole ref: type-matching alone would let
    // SKU-2 claim SKU-1's id and hand a refreshed workspace the wrong mount.
    const prev = reconcileIds(
      [],
      refs(["inventory:SKU-1", "inventory:SKU-2"]),
      minter()
    )
    const next = reconcileIds(
      prev,
      refs(["inventory:SKU-2", "inventory:SKU-1"]),
      minter("x")
    )
    expect(next.map((t) => t.param)).toEqual(["SKU-2", "SKU-1"])
    expect(next.map((t) => t.id)).toEqual(["new2", "new1"])
  })

  it("does not let a list claim its own record tab's id", () => {
    const prev = tabs([["a", "inventory"]])
    const next = reconcileIds(prev, refs(["inventory:SKU-1"]), minter())
    expect(next).toEqual([
      { id: "new1", screenType: "inventory", param: "SKU-1" },
    ])
  })

  it("preserves a record tab's id when a sibling draft is closed", () => {
    const prev = reconcileIds(
      [],
      refs(["inventory", "inventory:new-a", "inventory:SKU-1"]),
      minter()
    )
    const next = reconcileIds(
      prev,
      refs(["inventory", "inventory:SKU-1"]),
      minter("x")
    )
    expect(next.map((t) => t.id)).toEqual(["new1", "new3"])
  })
})

describe("refKey", () => {
  it("is the bare screen type without a param", () => {
    expect(refKey({ screenType: "inventory" as ScreenType })).toBe("inventory")
  })

  it("distinguishes a screen from its records, and records from each other", () => {
    const list = refKey({ screenType: "inventory" as ScreenType })
    const one = refKey({
      screenType: "inventory" as ScreenType,
      param: "SKU-1",
    })
    const two = refKey({
      screenType: "inventory" as ScreenType,
      param: "SKU-2",
    })
    expect(new Set([list, one, two]).size).toBe(3)
  })

  it("agrees for two refs naming the same record", () => {
    const a = { screenType: "inventory" as ScreenType, param: "SKU-1" }
    const b = { screenType: "inventory" as ScreenType, param: "SKU-1" }
    expect(refKey(a)).toBe(refKey(b))
  })
})
