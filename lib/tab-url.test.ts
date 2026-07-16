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
const pos = "pos" as WorkspaceContent["types"][number]
const users = "users" as WorkspaceContent["types"][number]

function content(types: string[], activeIndex: number): WorkspaceContent {
  return { types: types as WorkspaceContent["types"], activeIndex }
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
      launcherHref(content(["pos", "users"], 0), "reports" as typeof pos)
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
