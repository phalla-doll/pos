/**
 * What a screen's row-action toolbar wears, declared once.
 *
 * Two screens draw this row — the list's New/Edit/Approve/More/Search, and a
 * record's Create-or-Save/Approve/Delete/Clear/Close — and they are meant to
 * read as the same row seen at two altitudes. It lived as a local in
 * `list-screen.tsx`, which is exactly why the record form went without: a
 * palette rule stated inside one call site can only ever reach that one.
 *
 * `components/ui/button.tsx` and `button-group.tsx` are vendored, so this is
 * the call-site half of the pair — the CSS half is `blue-solid` in
 * `app/globals.css`.
 */

/**
 * Being *in* the row: the metrics every segment shares, so the group and the
 * pill beside it line up as one row. Wanted on its own by the buttons that
 * take the shape without the colour — the destructive one described below, and
 * the advanced card's Apply, which leads its surface the way New leads the
 * toolbar and is already `default`, so it has no palette swap to make.
 */
export const toolbarMetrics = "pr-3 pl-2.5"

/**
 * Being in the row *and* in the bar. `blue-solid` (`app/globals.css`) is what
 * colours a button like the `default` variant on the blue palette — the one
 * the picker calls "System" — while the neutral palettes keep the quiet
 * `outline` look these buttons are declared with.
 *
 * It goes on the actions a screen leads with and no others. Two standing
 * exceptions:
 *
 * - **Destructive actions never take it.** Delete wears `toolbarMetrics`
 *   alone: it belongs to the row, so it keeps the shape, but a solid-primary
 *   bar is not where "this is irreversible" belongs and the fill would paint
 *   over the one signal that says so.
 * - **Chrome is not an action.** The pager's and column headers' `ghost`
 *   buttons stay quiet. So does a button already declared `default`, which is
 *   solid on every palette and has nothing to swap.
 */
export const toolbarButton = `blue-solid ${toolbarMetrics}`
