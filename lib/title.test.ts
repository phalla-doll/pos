import { describe, expect, it } from "vitest"

import {
  APP_NAME,
  WORKSPACE_TITLE,
  documentTitle,
  titleTemplate,
  workspaceTitle,
} from "@/lib/title"

describe("documentTitle", () => {
  const cases: Array<[name: string, input: string | null | undefined]> = [
    ["null", null],
    ["undefined", undefined],
    ["empty string", ""],
    ["whitespace only", "   "],
  ]

  it.each(cases)("falls back to the app name for %s", (_name, input) => {
    expect(documentTitle(input)).toBe(APP_NAME)
  })

  it("applies the template to a page title", () => {
    expect(documentTitle("Inventory")).toBe(`Inventory · ${APP_NAME}`)
  })

  it("trims the page title", () => {
    expect(documentTitle("  Inventory  ")).toBe(`Inventory · ${APP_NAME}`)
  })

  it("agrees with the template handed to Next", () => {
    expect(titleTemplate.replace("%s", "Inventory")).toBe(
      documentTitle("Inventory")
    )
  })
})

describe("workspaceTitle", () => {
  it("names the active screen", () => {
    expect(workspaceTitle("Customers")).toBe(`Customers · ${APP_NAME}`)
  })

  it.each([null, undefined, "", "  "])(
    "falls back to the workspace title for %o",
    (input) => {
      expect(workspaceTitle(input)).toBe(documentTitle(WORKSPACE_TITLE))
    }
  )
})
