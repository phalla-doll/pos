import { describe, expect, it } from "vitest"

import {
  contentEquals,
  emptyContent,
  fromContent,
  initialWorkspaceState,
  normalize,
  tabsReducer,
  toContent,
  type WorkspaceContent,
  type WorkspaceState,
} from "@/lib/tabs-reducer"

// Small builders so cases read as data. Screen types are cast because the
// reducer never inspects them — it only compares them for equality.
type ScreenType = WorkspaceContent["refs"][number]["screenType"]

function state(
  tabs: Array<[id: string, screenType: string]>,
  activeId: string | null
): WorkspaceState {
  return {
    tabs: tabs.map(([id, screenType]) => ({
      id,
      screenType: screenType as ScreenType,
    })),
    activeId,
  }
}

/**
 * `content(["inventory", "inventory:SKU-1"], 0)` — a bare token is a screen,
 * a `type:param` token is that screen narrowed to one record.
 */
function content(tokens: string[], activeIndex: number): WorkspaceContent {
  return {
    refs: tokens.map((token) => {
      const [screenType, param] = token.split(":")
      return param === undefined
        ? { screenType: screenType as ScreenType }
        : { screenType: screenType as ScreenType, param }
    }),
    activeIndex,
  }
}

const inventory = "inventory" as ScreenType
const dashboard = "dashboard" as ScreenType

/** A deterministic mint so cases stay free of randomness. */
function minter(prefix = "new") {
  let n = 0
  return () => `${prefix}${++n}`
}

describe("open (reuse-or-create)", () => {
  it("creates and focuses a new tab when none of that type is open", () => {
    const next = tabsReducer(initialWorkspaceState, {
      type: "open",
      ref: { screenType: inventory },
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
      ref: { screenType: inventory },
      newId: "unused",
    })
    expect(next.tabs).toHaveLength(2)
    expect(next.activeId).toBe("a")
  })

  it("returns the same reference when reusing the already-active tab", () => {
    const start = state([["a", "inventory"]], "a")
    expect(
      tabsReducer(start, {
        type: "open",
        ref: { screenType: inventory },
        newId: "x",
      })
    ).toBe(start)
  })

  it("opens a record tab beside its list rather than reusing it", () => {
    const start = state([["a", "inventory"]], "a")
    const next = tabsReducer(start, {
      type: "open",
      ref: { screenType: inventory, param: "SKU-1" },
      newId: "b",
    })
    expect(next.tabs).toEqual([
      { id: "a", screenType: inventory },
      { id: "b", screenType: inventory, param: "SKU-1" },
    ])
    expect(next.activeId).toBe("b")
  })

  it("does not let the list reuse an open record tab", () => {
    const start = {
      tabs: [{ id: "a", screenType: inventory, param: "SKU-1" }],
      activeId: "a",
    }
    const next = tabsReducer(start, {
      type: "open",
      ref: { screenType: inventory },
      newId: "b",
    })
    expect(next.tabs).toHaveLength(2)
    expect(next.activeId).toBe("b")
  })

  it("focuses the tab a record is already open in", () => {
    // One record, one tab: two tabs disagreeing about the same row is the
    // thing this rule exists to prevent.
    const start = {
      tabs: [
        { id: "a", screenType: inventory, param: "SKU-1" },
        { id: "b", screenType: dashboard },
      ],
      activeId: "b",
    }
    const next = tabsReducer(start, {
      type: "open",
      ref: { screenType: inventory, param: "SKU-1" },
      newId: "unused",
    })
    expect(next.tabs).toHaveLength(2)
    expect(next.activeId).toBe("a")
  })

  it("opens a second tab for a different record of the same screen", () => {
    const start = {
      tabs: [{ id: "a", screenType: inventory, param: "SKU-1" }],
      activeId: "a",
    }
    const next = tabsReducer(start, {
      type: "open",
      ref: { screenType: inventory, param: "SKU-2" },
      newId: "b",
    })
    expect(next.tabs.map((t) => t.param)).toEqual(["SKU-1", "SKU-2"])
    expect(next.activeId).toBe("b")
  })

  it("gives every draft its own tab", () => {
    // The "as many as we want" rule: drafts carry freshly minted params, so
    // nothing they could match already exists and each New stacks up.
    const drafts = ["new-1", "new-2", "new-3"]
    const end = drafts.reduce(
      (acc, param, i) =>
        tabsReducer(acc, {
          type: "open",
          ref: { screenType: inventory, param },
          newId: `t${i}`,
        }),
      initialWorkspaceState
    )
    expect(end.tabs.map((t) => t.param)).toEqual(drafts)
    expect(end.activeId).toBe("t2")
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

// The bug this whole design exists to prevent: with two tabs of the same
// screen, closing one must leave the other's id — and therefore its mounted
// screen and everything typed into it — completely untouched.
describe("identity survives closing an identical sibling", () => {
  const twins = () =>
    state(
      [
        ["a", "inventory"],
        ["b", "inventory"],
      ],
      "b"
    )

  it("keeps the focused tab's id when its identical twin is closed", () => {
    const next = tabsReducer(twins(), { type: "close", id: "a" })
    expect(next.tabs).toEqual([{ id: "b", screenType: inventory }])
    expect(next.activeId).toBe("b")
  })

  it("closes exactly the tab asked for, not the leftmost of its type", () => {
    const next = tabsReducer(twins(), { type: "close", id: "b" })
    expect(next.tabs.map((t) => t.id)).toEqual(["a"])
  })

  it("keeps the focused tab's id through closeOthers", () => {
    const next = tabsReducer(twins(), { type: "closeOthers", id: "b" })
    expect(next.tabs).toEqual([{ id: "b", screenType: inventory }])
    expect(next.activeId).toBe("b")
  })

  it("leaves the source id alone when duplicating", () => {
    const next = tabsReducer(state([["a", "inventory"]], "a"), {
      type: "duplicate",
      id: "a",
      newId: "a2",
    })
    expect(next.tabs.map((t) => t.id)).toEqual(["a", "a2"])
    expect(next.activeId).toBe("a2")
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
    expect(tabsReducer(start, { type: "closeAll" })).toEqual(
      initialWorkspaceState
    )
  })
})

describe("sync (content from outside)", () => {
  it("adopts content on a cold start, minting ids", () => {
    const next = tabsReducer(initialWorkspaceState, {
      type: "sync",
      content: content(["dashboard", "inventory"], 1),
      mint: minter(),
    })
    expect(next.tabs).toEqual([
      { id: "new1", screenType: dashboard },
      { id: "new2", screenType: inventory },
    ])
    expect(next.activeId).toBe("new2")
  })

  it("keeps ids for tabs that survive an external change", () => {
    const start = state(
      [
        ["a", "dashboard"],
        ["b", "inventory"],
      ],
      "a"
    )
    const next = tabsReducer(start, {
      type: "sync",
      content: content(["dashboard", "inventory", "roles"], 2),
      mint: minter(),
    })
    expect(next.tabs.map((t) => t.id)).toEqual(["a", "b", "new1"])
    expect(next.activeId).toBe("new1")
  })

  it("normalizes the content it is given", () => {
    const next = tabsReducer(initialWorkspaceState, {
      type: "sync",
      content: content(["dashboard", "inventory"], 42),
      mint: minter(),
    })
    expect(next.activeId).toBe("new2")
  })

  it("empties the workspace when the URL has no tabs", () => {
    const start = state([["a", "dashboard"]], "a")
    const next = tabsReducer(start, {
      type: "sync",
      content: emptyContent,
      mint: minter(),
    })
    expect(next.tabs).toEqual([])
    expect(next.activeId).toBeNull()
  })

  it("returns the same reference when the content already matches", () => {
    const start = state(
      [
        ["a", "dashboard"],
        ["b", "inventory"],
      ],
      "b"
    )
    expect(
      tabsReducer(start, {
        type: "sync",
        content: content(["dashboard", "inventory"], 1),
        mint: minter(),
      })
    ).toBe(start)
  })
})

describe("normalize (whatever the URL hands us)", () => {
  it.each([
    ["clamps an index past the end", content(["dashboard", "inventory"], 9), 1],
    ["clamps a negative index", content(["dashboard", "inventory"], -3), 0],
    [
      "focuses the first tab when the index is missing",
      content(["dashboard"], -1),
      0,
    ],
    [
      "defaults a non-integer index to the first tab",
      content(["dashboard"], NaN),
      0,
    ],
  ])("%s", (_label, input, expected) => {
    expect(normalize(input).activeIndex).toBe(expected)
  })

  it("collapses a stray index with no tabs to the empty workspace", () => {
    expect(normalize(content([], 3))).toEqual(emptyContent)
  })

  it("returns the same reference when the content is already valid", () => {
    const start = content(["dashboard", "inventory"], 1)
    expect(normalize(start)).toBe(start)
  })
})

describe("toContent / fromContent", () => {
  it("projects state down to what the URL carries", () => {
    const start = state(
      [
        ["a", "inventory"],
        ["b", "inventory"],
      ],
      "b"
    )
    expect(toContent(start)).toEqual(content(["inventory", "inventory"], 1))
  })

  it("reports no focus for an empty workspace", () => {
    expect(toContent(initialWorkspaceState)).toEqual(content([], -1))
  })

  it("round-trips content through a placeholder state", () => {
    const start = content(["dashboard", "inventory", "inventory"], 2)
    expect(toContent(fromContent(start))).toEqual(start)
  })

  it("round-trips empty content", () => {
    expect(toContent(fromContent(emptyContent))).toEqual(emptyContent)
  })
})

describe("contentEquals", () => {
  it.each([
    ["identical content", content(["a", "b"], 1), content(["a", "b"], 1), true],
    [
      "a different index",
      content(["a", "b"], 0),
      content(["a", "b"], 1),
      false,
    ],
    [
      "a different order",
      content(["b", "a"], 0),
      content(["a", "b"], 0),
      false,
    ],
    ["a different length", content(["a"], 0), content(["a", "b"], 0), false],
    ["repeats vs one", content(["a", "a"], 0), content(["a"], 0), false],
  ])("%s", (_label, a, b, expected) => {
    expect(contentEquals(a, b)).toBe(expected)
  })
})
