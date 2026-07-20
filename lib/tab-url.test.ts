import { describe, expect, it } from "vitest"

import {
  freshWorkspaceHref,
  launcherHref,
  contentFromSearch,
  workspaceHref,
} from "@/lib/tab-url"
import type { WorkspaceContent } from "@/lib/tabs-reducer"

// Real registry keys — this module validates against the screen registry, so
// unlike the reducer's tests these can't be arbitrary strings.
type ScreenType = WorkspaceContent["refs"][number]["screenType"]
const pos = { screenType: "pos" as ScreenType }
const users = { screenType: "users" as ScreenType }

/** `"inventory:SKU-0001"` → a ref, mirroring one `?tabs=` token. */
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

describe("contentFromSearch", () => {
  it("reads the open tabs and the focused index", () => {
    expect(contentFromSearch("?tabs=pos,users&i=1")).toEqual(
      content(["pos", "users"], 1)
    )
  })

  it("keeps the same screen listed twice", () => {
    expect(contentFromSearch("?tabs=pos,pos,users&i=2")).toEqual(
      content(["pos", "pos", "users"], 2)
    )
  })

  it("focuses the first tab when the index is absent", () => {
    expect(contentFromSearch("?tabs=pos,users")).toEqual(
      content(["pos", "users"], 0)
    )
  })

  it("clamps an index past the end", () => {
    expect(contentFromSearch("?tabs=pos,users&i=9")).toEqual(
      content(["pos", "users"], 1)
    )
  })

  it("drops screens that aren't in the registry, keeping the rest", () => {
    expect(contentFromSearch("?tabs=pos,lolwut,users")).toEqual(
      content(["pos", "users"], 0)
    )
  })

  it("yields an empty workspace when every screen is junk", () => {
    expect(contentFromSearch("?tabs=nope&i=2")).toEqual(content([], -1))
  })

  it("yields an empty workspace for an empty query", () => {
    expect(contentFromSearch("")).toEqual(content([], -1))
  })

  it("ignores a stray index with no tabs", () => {
    expect(contentFromSearch("?i=3")).toEqual(content([], -1))
  })

  it("reads a record tab beside its list", () => {
    expect(contentFromSearch("?tabs=inventory,inventory:SKU-0001&i=1")).toEqual(
      content(["inventory", "inventory:SKU-0001"], 1)
    )
  })

  it("keeps several records of one screen apart", () => {
    expect(
      contentFromSearch("?tabs=inventory:SKU-0001,inventory:SKU-0002")
    ).toEqual(content(["inventory:SKU-0001", "inventory:SKU-0002"], 0))
  })

  it("reads a draft token", () => {
    expect(contentFromSearch("?tabs=inventory:new-a3f9")).toEqual(
      content(["inventory:new-a3f9"], 0)
    )
  })

  it("round-trips a record tab through the serializer", () => {
    const start = content(["inventory", "inventory:SKU-0001"], 1)
    const href = workspaceHref(start)
    expect(href).toBe("/dashboard?tabs=inventory,inventory:SKU-0001&i=1")
    expect(contentFromSearch(href.split("?")[1] ?? "")).toEqual(start)
  })
})

describe("workspaceHref", () => {
  it("serializes tabs and the focused index", () => {
    expect(workspaceHref(content(["pos", "users"], 1))).toBe(
      "/dashboard?tabs=pos,users&i=1"
    )
  })

  it("omits the index when the first tab is focused", () => {
    expect(workspaceHref(content(["pos", "users"], 0))).toBe(
      "/dashboard?tabs=pos,users"
    )
  })

  it("drops both params for an empty workspace", () => {
    expect(workspaceHref(content([], -1))).toBe("/dashboard")
  })

  it("round-trips through contentFromSearch", () => {
    const start = content(["pos", "users", "pos"], 2)
    const href = workspaceHref(start)
    expect(contentFromSearch(href.split("?")[1] ?? "")).toEqual(start)
  })
})

describe("launcherHref", () => {
  it("appends and focuses a screen that isn't open", () => {
    expect(launcherHref(content(["pos"], 0), users)).toBe(
      "/dashboard?tabs=pos,users&i=1"
    )
  })

  it("preserves the tabs already open", () => {
    expect(
      launcherHref(content(["pos", "users"], 0), {
        screenType: "reports" as ScreenType,
      })
    ).toBe("/dashboard?tabs=pos,users,reports&i=2")
  })

  it("focuses an existing tab instead of opening a second one", () => {
    expect(launcherHref(content(["pos", "users"], 1), pos)).toBe(
      "/dashboard?tabs=pos,users"
    )
  })

  it("opens into an empty workspace", () => {
    expect(launcherHref(content([], -1), pos)).toBe("/dashboard?tabs=pos")
  })
})

describe("freshWorkspaceHref", () => {
  it("opens the screen alone, ignoring anything else", () => {
    expect(freshWorkspaceHref(users)).toBe("/dashboard?tabs=users")
  })
})
