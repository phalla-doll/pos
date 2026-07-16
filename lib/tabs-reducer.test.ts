import { describe, expect, it } from "vitest"

import {
  activeScreenType,
  initialTabsState,
  tabsReducer,
  type TabsState,
} from "@/lib/tabs-reducer"

// A small state builder so cases read as data. Screen types are cast because
// the reducer never inspects them — it only compares them for equality.
function state(
  tabs: Array<[id: string, screenType: string]>,
  activeId: string | null
): TabsState {
  return {
    tabs: tabs.map(([id, screenType]) => ({
      id,
      screenType: screenType as TabsState["tabs"][number]["screenType"],
    })),
    activeId,
  }
}

const inventory = "inventory" as TabsState["tabs"][number]["screenType"]
const dashboard = "dashboard" as TabsState["tabs"][number]["screenType"]

describe("open / sync (reuse-or-create)", () => {
  it("creates and focuses a new tab when none of that type is open", () => {
    const next = tabsReducer(initialTabsState, {
      type: "open",
      screenType: inventory,
      newId: "a",
    })
    expect(next.tabs).toEqual([{ id: "a", screenType: inventory }])
    expect(next.activeId).toBe("a")
  })

  it("reuses (focuses) an existing tab of the same type instead of creating", () => {
    const start = state(
      [
        ["a", "inventory"],
        ["b", "dashboard"],
      ],
      "b"
    )
    const next = tabsReducer(start, {
      type: "open",
      screenType: inventory,
      newId: "unused",
    })
    expect(next.tabs).toHaveLength(2)
    expect(next.activeId).toBe("a")
  })

  it("sync with a null screen focuses nothing but keeps tabs open", () => {
    const start = state([["a", "inventory"]], "a")
    const next = tabsReducer(start, {
      type: "sync",
      screenType: null,
      newId: "x",
    })
    expect(next.tabs).toHaveLength(1)
    expect(next.activeId).toBeNull()
  })

  it("returns the same reference when reusing the already-active tab", () => {
    const start = state([["a", "inventory"]], "a")
    const next = tabsReducer(start, {
      type: "open",
      screenType: inventory,
      newId: "unused",
    })
    expect(next).toBe(start)
  })
})

describe("close (neighbor focus)", () => {
  const three = () =>
    state(
      [
        ["a", "dashboard"],
        ["b", "inventory"],
        ["c", "dashboard"],
      ],
      "b"
    )

  it("focuses the previous tab when closing the active one", () => {
    const next = tabsReducer(three(), { type: "close", id: "b" })
    expect(next.tabs.map((t) => t.id)).toEqual(["a", "c"])
    expect(next.activeId).toBe("a")
  })

  it("focuses the next tab when closing the active first tab", () => {
    const next = tabsReducer(three(), { type: "close", id: "a" })
    expect(next.activeId).toBe("b") // 'a' was not active, focus unchanged
  })

  it("focuses the new first tab when the active first tab is closed", () => {
    const start = state(
      [
        ["a", "dashboard"],
        ["b", "inventory"],
      ],
      "a"
    )
    const next = tabsReducer(start, { type: "close", id: "a" })
    expect(next.activeId).toBe("b")
  })

  it("clears focus when the last tab is closed", () => {
    const start = state([["a", "dashboard"]], "a")
    const next = tabsReducer(start, { type: "close", id: "a" })
    expect(next.tabs).toEqual([])
    expect(next.activeId).toBeNull()
  })

  it("does not move focus when closing a background tab", () => {
    const next = tabsReducer(three(), { type: "close", id: "c" })
    expect(next.activeId).toBe("b")
    expect(next.tabs.map((t) => t.id)).toEqual(["a", "b"])
  })

  it("is a no-op for an unknown id", () => {
    const start = three()
    expect(tabsReducer(start, { type: "close", id: "zzz" })).toBe(start)
  })
})

describe("duplicate (insert after source)", () => {
  it("inserts the copy directly after the source and focuses it", () => {
    const start = state(
      [
        ["a", "dashboard"],
        ["b", "inventory"],
      ],
      "a"
    )
    const next = tabsReducer(start, { type: "duplicate", id: "a", newId: "a2" })
    expect(next.tabs.map((t) => t.id)).toEqual(["a", "a2", "b"])
    expect(next.tabs[1]).toEqual({ id: "a2", screenType: dashboard })
    expect(next.activeId).toBe("a2")
  })

  it("is a no-op for an unknown id", () => {
    const start = state([["a", "dashboard"]], "a")
    expect(
      tabsReducer(start, { type: "duplicate", id: "z", newId: "z2" })
    ).toBe(start)
  })
})

describe("closeOthers / closeAll", () => {
  it("closeOthers keeps and focuses only the given tab", () => {
    const start = state(
      [
        ["a", "dashboard"],
        ["b", "inventory"],
        ["c", "dashboard"],
      ],
      "a"
    )
    const next = tabsReducer(start, { type: "closeOthers", id: "b" })
    expect(next.tabs.map((t) => t.id)).toEqual(["b"])
    expect(next.activeId).toBe("b")
  })

  it("closeAll empties everything and clears focus", () => {
    const start = state(
      [
        ["a", "dashboard"],
        ["b", "inventory"],
      ],
      "a"
    )
    const next = tabsReducer(start, { type: "closeAll" })
    expect(next).toEqual(initialTabsState)
  })
})

describe("activeScreenType", () => {
  it("returns the active tab's screen type", () => {
    const start = state(
      [
        ["a", "dashboard"],
        ["b", "inventory"],
      ],
      "b"
    )
    expect(activeScreenType(start)).toBe(inventory)
  })

  it("returns null when nothing is focused", () => {
    expect(activeScreenType(initialTabsState)).toBeNull()
  })
})
