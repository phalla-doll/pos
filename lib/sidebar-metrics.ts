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
 *
 * 56px against {@link railButton}'s 36px leaves 10px of rail either side of a
 * button, up from the 6px that `3rem` gave. The buttons themselves are
 * unchanged: this is the column they sit in getting wider, not the targets.
 * That gutter is the only thing separating the glyphs from the page edge on
 * one side and the workspace on the other, and at 6px the column read as tight
 * around them rather than as a rail they sit on.
 */
export const SIDEBAR_WIDTH_ICON = "3.5rem"

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
 *
 * `mx-auto` is what keeps it centred in the rail, and it is load-bearing rather
 * than belt-and-braces. The vendored button is `w-full`, so it filled its item
 * and centring never came up; pinned to 36px it becomes a fixed-width box
 * left-aligned in whatever the item leaves. At the old 3rem rail that was
 * invisible — 48px less the group's 6px padding either side is exactly 36px, so
 * the button had nowhere to sit but centred, by arithmetic rather than by
 * intent. Any other rail width exposes the slack on the right.
 *
 * `justify-center` is the other half and does a different job: that one centres
 * the glyph inside the button, this one centres the button inside the rail.
 */
export const railButton =
  "mx-auto size-9! group-data-[collapsible=icon]:size-9! justify-center [&_svg]:size-4!"

/**
 * A nav item's label size: 13.5px, a half-step under the vendored `text-sm`.
 *
 * Stated here rather than at each call site because both sidebars render nav
 * items — pane 2's drill-in panel on desktop (`components/nav-panel.tsx`), the
 * whole tree in the off-canvas sheet on mobile (`components/nav-main.tsx`) —
 * and a size that only lands on one of them is the drift this file exists to
 * prevent.
 *
 * Two constants because the two primitives declare their size differently:
 * `SidebarMenuButton` uses a plain `text-sm` that tailwind-merge drops in
 * favour of whatever `className` brings, while `SidebarMenuSubButton` states
 * its size under `data-[size=md]`, whose attribute selector outranks a bare
 * class — so the override has to re-assert under the same variant to win.
 */
export const navItemText = "text-[0.84375rem]"
export const navSubItemText = "data-[size=md]:text-[0.84375rem]"
