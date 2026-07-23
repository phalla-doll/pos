import { describe, expect, it } from "vitest"

import { userInitials } from "@/lib/user-initials"

describe("userInitials", () => {
  it("takes the first and last words' initials", () => {
    expect(userInitials("Ada Lovelace")).toBe("AL")
    expect(userInitials("Jean Luc Picard")).toBe("JP")
  })

  it("takes the first two letters of a single word", () => {
    expect(userInitials("shadcn")).toBe("SH")
    expect(userInitials("x")).toBe("X")
  })

  it("ignores surrounding and repeated whitespace", () => {
    expect(userInitials("  Ada   Lovelace  ")).toBe("AL")
  })

  it("returns an empty string for empty or blank input", () => {
    expect(userInitials("")).toBe("")
    expect(userInitials("   ")).toBe("")
  })
})
