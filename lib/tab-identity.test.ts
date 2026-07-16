import { describe, expect, it } from "vitest"

import { reconcileIds, type Tab } from "@/lib/tab-identity"

// Screen types are cast because reconcileIds never inspects them — it only
// compares them for equality.
type ScreenType = Tab["screenType"]

function tabs(entries: Array<[id: string, screenType: string]>): Tab[] {
  return entries.map(([id, screenType]) => ({
    id,
    screenType: screenType as ScreenType,
  }))
}

function types(list: string[]): ScreenType[] {
  return list as ScreenType[]
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
})
