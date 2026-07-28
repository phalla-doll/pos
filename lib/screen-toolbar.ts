/**
 * What a screen's row-action toolbar wears, declared once.
 *
 * Two screens draw this row — the list's New/Edit/Approve/More/Search, and a
 * record's Create-or-Save/Approve/Delete/Clear/Close — and they are meant to
 * read as the same row seen at two altitudes. It lived as a local in
 * `list-screen.tsx`, which is exactly why the record form went without: a
 * palette rule stated inside one call site can only ever reach that one.
 *
 * `components/ui/button.tsx` is vendored, so this is the call-site half of the
 * pair — the CSS half is `toolbar-bar` / `toolbar-tint` in `app/globals.css`.
 * The split is by *kind*, not by convenience: colour is a theme's answer and
 * lives in the stylesheet with the token it reads; shape and spacing are this
 * row's own and live here, where the two screens that draw the row can see
 * them.
 */

/**
 * Being *in* the row: the metrics every button shares, so the trays and the
 * buttons in them line up as one row. Wanted on its own by the buttons that
 * take the shape without the colour — the destructive one described below, and
 * the advanced card's Apply, which leads its own surface rather than this row.
 *
 * `h-7` over the button base's `h-8`. This row is chrome above the screen's
 * content, not part of it, and 32px of it was reading as a band the table had
 * to start underneath. 28px is a size the app already keeps for controls that
 * frame something rather than being it — the table's filter inputs are the same
 * — and it is the shortest step that still leaves the 14px labels their line
 * box. The tray follows it down: 28 + 4 of `p-0.5` + the rim is 34px, where the
 * row was 42.
 *
 * The radius follows the height, which is why it is a number and not a step.
 * A chip in a pill tray is read against that pill: the base's 10px on a 32px
 * button looked *cut* next to a fully round one, because the eye compares
 * curves rather than measuring radii. 12px on 28px holds the same ratio the
 * 14px did at 32 — the same family of shape a size down, which is what a thing
 * sitting inside another thing should look like. It has to be short of half the
 * height, or the chip becomes a pill: at `h-7` the `rounded-xl` this used to be
 * *is* 14px, exactly the pill point, so keeping the step would have quietly
 * turned every chip into the shape the tray is. And a chip must not be that: in
 * a row of them, matching the tray makes the end ones look like its own caps. A
 * button *alone* in a tray has no row to be part of and takes the pill at its
 * call site, where that case is argued.
 */
export const toolbarMetrics = "h-7 rounded-[0.75rem] pr-3 pl-2.5"

/**
 * The tray the buttons sit in — the tinted surface itself, which is the thing
 * that reads as "the toolbar". Buttons in it are transparent until hovered; see
 * `app/globals.css` for why the tint is the tray's and not each button's.
 *
 * `p-0.5` is what gives the tray its inside: 2px of the tint stays visible
 * around every button, so a hovered one is a chip *within* the surface instead
 * of a fill flush to its edge. That is all the job needs — the inset has to be
 * seen, not felt, and 4px of it read as the tray holding the buttons at arm's
 * length. `gap-0.5` sets how far apart the chips land, and matching the two at
 * 2px is what makes the spacing read as one inset all the way round rather than
 * as a margin and a gutter that happen to be near each other.
 *
 * `border` is the width only; the colour is the stylesheet's, like the fill.
 * It costs the row 2px of height and buys the tray an edge — a 7% tint alone
 * is close enough to the workspace behind it that the pill's shape had to be
 * inferred from where the colour stopped, which is not the same as seeing it.
 * At a 2px inset it earns that height twice over: there is barely any tint left
 * outside the chips to show where the tray ends, so the rim is most of what
 * draws it.
 *
 * `rounded-full` against the buttons' own `rounded-lg`: the tray is one pill,
 * and a chip with a tighter corner inside it reads as sitting *in* something.
 * Matching radii would have made the hover look like the tray's own end cap.
 *
 * A plain `<div role="group">` wears this, not `ButtonGroup`. That component
 * builds a segmented control — one shared outline, squared inner corners,
 * dropped left borders — which is a different object from a tray of separate
 * controls, and every one of those rules would have had to be turned back off
 * (two of them `!important`, so not merely turned off). Reaching for a
 * component and then neutralising its variants is not using the component.
 *
 * The row can hold more than one tray. The list's Search and the record's Close
 * each get their own: both stand apart from the actions beside them — one
 * changes what the table shows rather than what it holds, the other only puts
 * the tab away — and a tray of one is how that separation is drawn now that
 * there is no shared outline to break out of.
 */
export const toolbarBar =
  "toolbar-bar flex w-fit items-center gap-0.5 rounded-full border p-0.5"

/**
 * A button in that tray. `toolbar-tint` (`app/globals.css`) strips the fill and
 * border of the `outline` variant these are declared with, so the tray shows
 * through, and puts the accent on the icon.
 *
 * On every theme, which it did not used to be: the tint was the blue palette's
 * alone, and the neutral ones kept the bare outline. What the row looks like is
 * not really a palette question — it is where the screen says what you can do —
 * so it is now stated once and `--toolbar-accent` is what each theme answers.
 *
 * It goes on the actions a screen leads with and no others. Two standing
 * exceptions:
 *
 * - **Destructive actions never take it.** Delete wears `toolbarMetrics`
 *   alone: it belongs to the row, so it keeps the shape, but it must not go
 *   transparent into the tray with the rest — its colour is the one signal
 *   saying the click can't be taken back.
 * - **Chrome is not an action.** The pager's and column headers' `ghost`
 *   buttons stay quiet. So does a button already declared `default`, whose
 *   solid fill leads a surface of its own rather than joining this row.
 */
export const toolbarButton = `toolbar-tint ${toolbarMetrics}`
