import { describe, expect, it } from "vitest"

import { article, withArticle } from "@/lib/article"

describe("article", () => {
  it("uses 'an' before a vowel", () => {
    // The case that prompted this: Inventory declares `noun: "item"`, and the
    // fixed sentence around it read "Add a item to Inventory".
    expect(article("item")).toBe("an")
  })

  it("uses 'a' before a consonant", () => {
    expect(article("customer")).toBe("a")
  })

  it("covers the registry's default noun", () => {
    expect(article("record")).toBe("a")
  })

  it("ignores case", () => {
    expect(article("Item")).toBe("an")
  })

  it("ignores leading whitespace", () => {
    expect(article(" item")).toBe("an")
  })

  it("falls back to 'a' for an empty noun", () => {
    // No noun means no sentence worth building, but the caller shouldn't get
    // `undefined` spliced into its copy.
    expect(article("")).toBe("a")
  })

  it("goes by spelling, not sound", () => {
    // Documented limitation rather than a bug: a screen wanting "a unit" says
    // so by declaring the noun with its own article. Pinned so the tradeoff
    // is a decision someone made, not a surprise someone finds.
    expect(article("unit")).toBe("an")
    expect(article("hour")).toBe("a")
  })
})

describe("withArticle", () => {
  it("joins the article to the noun", () => {
    expect(withArticle("item")).toBe("an item")
    expect(withArticle("customer")).toBe("a customer")
  })
})
