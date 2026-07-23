/**
 * Sidebar sizing, declared once.
 *
 * `components/ui/sidebar.tsx` is vendored — its classes are not ours to edit —
 * so the rail's width and its buttons' size are overridden from the call site:
 * the width through the `--sidebar-width-icon` custom property the provider
 * already reads, the buttons through `className`.
 */

/**
 * Width of pane 1, the icon rail. It is the same width the outer sidebar
 * collapses *to*, so a collapsed sidebar is exactly the rail with nothing
 * beside it. The nested pane-1 sidebar is pinned to `--sidebar-width-icon`
 * (+1px for its border) in `components/app-sidebar.tsx`.
 */
export const SIDEBAR_WIDTH_ICON = "3.5rem"

/**
 * A pane-1 rail button: a fixed 40px square with a centered 20px glyph. Unlike
 * the old collapse-responsive styling, this does *not* key off the sidebar's
 * collapsible state — the rail is statically narrow whether or not pane 2 is
 * open, so its buttons must stay compact in both. The `!` on `size-10` beats
 * the vendored variant's `group-data-[collapsible=icon]:size-8!`, which would
 * otherwise shrink the buttons the moment pane 2 collapses.
 */
export const railButton = "size-10! justify-center [&_svg]:size-5!"
