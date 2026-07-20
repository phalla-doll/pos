import { getScreen } from "@/lib/screens"
import type { ScreenRef } from "@/lib/tab-identity"

/**
 * What a tab is called: the screen's registry label, or — for a tab narrowed
 * to one record — whatever that screen's `detail` names the param.
 *
 * Stated once because three surfaces ask the same question and must agree: the
 * tab chip, the overflow menu that stands in for chips it can't fit, and the
 * browser tab title. It also has to agree with itself over time — the chip's
 * measured width is cached per ref, so a label that rendered differently in
 * two places would size one of them wrong.
 *
 * Falls back to the raw screen type for a ref the registry doesn't know. That
 * shouldn't reach here (the URL codec drops unknown screens), so this is the
 * belt to that parser's braces rather than a case worth designing around.
 */
export function tabTitle(ref: ScreenRef): string {
  const screen = getScreen(ref.screenType)
  if (!screen) return ref.screenType
  if (ref.param === undefined || !screen.detail) return screen.label
  return screen.detail.label(ref.param)
}
