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
export const SIDEBAR_WIDTH_ICON = "3rem"

/**
 * A pane-1 rail button: a fixed 36px square with a centered 16px glyph. The
 * rail is statically narrow whether or not pane 2 is open, so its buttons must
 * stay 36px in both states.
 *
 * The catch: these buttons live *inside* the outer `collapsible="icon"`
 * sidebar, which collapses whenever pane 2 is closed — so the vendored base
 * class's `group-data-[collapsible=icon]:size-8!` matches and shrinks them to
 * 32px the moment the panel closes. A bare `size-9!` does *not* win that:
 * both are `!important`, and the vendored selector's `.group[data-collapsible]`
 * carries higher specificity, which outranks `!important`. So we re-assert the
 * size under the *same* variant — equal specificity, and `size-9` sorts after
 * `size-8`, so it wins — pinning the button to 36px in the collapsed state too.
 */
export const railButton =
  "size-9! group-data-[collapsible=icon]:size-9! justify-center [&_svg]:size-4!"
