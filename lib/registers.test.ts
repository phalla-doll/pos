import { describe, expect, it } from "vitest"

import { allRegisters, registerLabel, type Store } from "@/lib/registers"
import { defaultRegisterId, posStores } from "@/lib/fixtures"

const stores: Store[] = [
  {
    name: "First",
    registers: [
      { id: "a1", name: "Register 1" },
      { id: "a2", name: "Register 2" },
    ],
  },
  { name: "Second", registers: [{ id: "b1", name: "Counter" }] },
  { name: "Empty", registers: [] },
]

describe("registerLabel", () => {
  it.each([
    ["a1", "First · Register 1"],
    ["a2", "First · Register 2"],
    ["b1", "Second · Counter"],
  ])("names %s as %s", (id, expected) => {
    expect(registerLabel(stores, id)).toBe(expected)
  })

  it("answers null for an id no store claims", () => {
    expect(registerLabel(stores, "nope")).toBeNull()
  })

  it("answers null when there are no stores", () => {
    expect(registerLabel([], "a1")).toBeNull()
  })
})

describe("allRegisters", () => {
  it("flattens in store order and skips empty stores", () => {
    expect(allRegisters(stores).map((r) => r.id)).toEqual(["a1", "a2", "b1"])
  })
})

// The fixtures are the app's actual data, so they get the same checks the
// helper's contract rests on: ids unique across stores, and the default one
// pointing at a register that exists.
describe("posStores fixture", () => {
  it("keeps register ids unique across stores", () => {
    const ids = allRegisters(posStores).map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("defaults to a register that exists", () => {
    expect(registerLabel(posStores, defaultRegisterId)).not.toBeNull()
  })
})
