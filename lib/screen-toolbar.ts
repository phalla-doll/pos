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
 * A button in that toolbar. The padding is shared so the segmented group and
 * the pill beside it read as one row; `blue-solid` (`app/globals.css`) is what
 * colours them like the `default` variant on the blue palette — the one the
 * picker calls "System" — while the neutral palettes keep the quiet `outline`
 * look these buttons are declared with.
 *
 * It goes on the actions a screen leads with and no others. Two standing
 * exceptions:
 *
 * - **Destructive actions never take it.** Delete keeps its own colour on
 *   every palette; a solid-primary bar is not where "this is irreversible"
 *   belongs, and the fill would paint over the one signal that says so.
 * - **Chrome is not an action.** The pager's and column headers' `ghost`
 *   buttons stay quiet. So does a button already declared `default`, which is
 *   solid on every palette and has nothing to swap.
 */
export const toolbarButton = "blue-solid pr-3 pl-2.5"
