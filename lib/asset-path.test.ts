import { describe, expect, it } from "vitest"

import { assetPath } from "./asset-path"

describe("assetPath", () => {
  const cases: Array<{
    name: string
    path: string
    prefix: string
    want: string
  }> = [
    {
      name: "prefixes a public asset when deployed under a basePath",
      path: "/avatars/shadcn.png",
      prefix: "/pos",
      want: "/pos/avatars/shadcn.png",
    },
    {
      name: "leaves the path alone when there is no basePath",
      path: "/avatars/shadcn.png",
      prefix: "",
      want: "/avatars/shadcn.png",
    },
    {
      name: "is idempotent — an already-prefixed path is not doubled",
      path: "/pos/avatars/shadcn.png",
      prefix: "/pos",
      want: "/pos/avatars/shadcn.png",
    },
    {
      name: "does not mistake a lookalike sibling for the prefix",
      path: "/position/chart.png",
      prefix: "/pos",
      want: "/pos/position/chart.png",
    },
    {
      name: "leaves absolute URLs untouched",
      path: "https://example.com/avatar.png",
      prefix: "/pos",
      want: "https://example.com/avatar.png",
    },
    {
      name: "leaves data URLs untouched",
      path: "data:image/png;base64,iVBOR",
      prefix: "/pos",
      want: "data:image/png;base64,iVBOR",
    },
    {
      name: "leaves relative paths untouched",
      path: "avatars/shadcn.png",
      prefix: "/pos",
      want: "avatars/shadcn.png",
    },
    {
      name: "returns the basePath itself unchanged",
      path: "/pos",
      prefix: "/pos",
      want: "/pos",
    },
  ]

  for (const { name, path, prefix, want } of cases) {
    it(name, () => {
      expect(assetPath(path, prefix)).toBe(want)
    })
  }
})
