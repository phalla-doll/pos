import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import {
  MOD,
  needsMod,
  normalizeKeyLabel,
  shortcutEventKey,
  shortcuts,
  type ShortcutId,
} from "@/lib/shortcuts"

describe("shortcuts", () => {
  it("gives every entry a unique id", () => {
    const ids = shortcuts.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(shortcuts)(
    "$id: eventKey is the chord's last key, normalized",
    (shortcut) => {
      const last = shortcut.keys[shortcut.keys.length - 1]
      expect(shortcut.eventKey).toBe(normalizeKeyLabel(last))
    }
  )

  it.each(shortcuts)("$id: never ends on the modifier", (shortcut) => {
    // Otherwise `eventKey` would be "mod" and the handler would wait forever
    // for a key that no keyboard sends.
    expect(shortcut.keys[shortcut.keys.length - 1]).not.toBe(MOD)
  })

  it.each([
    ["K", "k"],
    ["D", "d"],
    ["Esc", "escape"],
    ["esc", "escape"],
  ])("normalizes %s to %s", (label, expected) => {
    expect(normalizeKeyLabel(label)).toBe(expected)
  })

  it("answers the key a handler should compare against", () => {
    expect(shortcutEventKey("search")).toBe("k")
    expect(shortcutEventKey("dismiss-panel")).toBe("escape")
  })

  it("throws on an id it doesn't have", () => {
    expect(() => shortcutEventKey("nope" as ShortcutId)).toThrow(/Unknown/)
  })

  it("reads the modifier off the keys", () => {
    const bySearch = shortcuts.find((s) => s.id === "search")!
    const byTheme = shortcuts.find((s) => s.id === "toggle-theme")!
    expect(needsMod(bySearch)).toBe(true)
    expect(needsMod(byTheme)).toBe(false)
  })

  // The sidebar's chord is the one this list can't derive: it's declared inside
  // a vendored shadcn component, which the repo's conventions say not to edit.
  // So it gets the `findNavIssues` treatment instead — the source is read and
  // checked, and the help popover fails a test rather than lying to a user.
  it("matches the sidebar's own toggle key", () => {
    const source = readFileSync(
      new URL("../components/ui/sidebar.tsx", import.meta.url),
      "utf8"
    )
    const declared = source.match(
      /SIDEBAR_KEYBOARD_SHORTCUT\s*=\s*"([^"]+)"/
    )?.[1]
    expect(declared).toBe(shortcutEventKey("toggle-sidebar"))
  })
})
