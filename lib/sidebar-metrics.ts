/**
 * Collapsed-rail sizing, declared once.
 *
 * `components/ui/sidebar.tsx` is vendored — its classes are not ours to edit —
 * so the rail's width and its buttons' collapsed size are both overridden from
 * the call site: the width through the `--sidebar-width-icon` custom property
 * the provider already reads, the buttons through `className`.
 */

/** Width of the rail when `collapsible="icon"` has collapsed the sidebar. */
export const SIDEBAR_WIDTH_ICON = "3.5rem"

/**
 * Enlarges a rail button and its icon while collapsed, leaving the expanded
 * sidebar untouched. The `!` mirrors the `size-8!` in the vendored button
 * variant — without it the override loses to the variant it is replacing.
 *
 * The label is hidden rather than left to the button's `overflow-hidden`: at
 * the vendored 32px/16px pairing the text began exactly on the clip edge, but
 * a 20px icon pushes it 4px inside, so the first glyph showed as a sliver.
 *
 * Once that label is gone the icon is the button's only child, and the button
 * is a plain `flex` — so it sits flush against the leading padding instead of
 * in the middle of the tile. `justify-center` is what actually centres it;
 * padding cannot, since the icon does not fill the box.
 */
export const collapsedRailButton = [
  "group-data-[collapsible=icon]:size-10!",
  "group-data-[collapsible=icon]:justify-center",
  "group-data-[collapsible=icon]:[&_svg]:size-5",
  // Excluding the avatar: shadcn's Avatar root is itself a span, so a bare
  // `&>span` would hide the very thing the user button collapses down to.
  "group-data-[collapsible=icon]:[&>span:not([data-slot=avatar])]:hidden",
  // A group trigger is icon + label + chevron, so its chevron is the only
  // trailing svg; a leaf's label span is last, matching nothing here.
  "group-data-[collapsible=icon]:[&>svg:last-child]:hidden",
].join(" ")

/**
 * Same growth for a square child that fills the collapsed button — the team
 * logo tile and the user avatar, which carry their own `size-8`.
 */
export const collapsedRailTile = "group-data-[collapsible=icon]:size-10"

/**
 * The two-line text block beside the header logo and the user avatar. Those
 * are `div`s, so {@link collapsedRailButton}'s span rule does not reach them,
 * and they can no longer be left to the button's `overflow-hidden`: that only
 * happened to work while the tile beside them was wide enough to push them
 * past the clip edge.
 */
export const collapsedRailLabel = "group-data-[collapsible=icon]:hidden"

/**
 * Makes a peek *overlay* the page instead of pushing it.
 *
 * The vendored sidebar lays out as two elements: a spacer that occupies the
 * width in flow, and a `fixed` container that paints on top of it. Both size
 * themselves off the same collapsed/expanded flag, so opening normally grows
 * the spacer and the page reflows — right for a deliberate toggle, wrong for a
 * hover the user may not have meant. Pinning the spacer at rail width while the
 * container opens over it is what makes the peek weightless.
 *
 * The spacer takes no props, so it is reached by slot from the provider, which
 * is the nearest ancestor a call site can style. Applied only while peeking.
 */
export const peekOverlay =
  "[&_[data-slot=sidebar-gap]]:w-(--sidebar-width-icon)"

/**
 * A row in the rail's flyout menu, sized to match `SidebarMenuSubButton` as
 * the expanded sidebar renders it — the flyout stands in for that sub-menu, so
 * the two should not disagree on row height or icon gap. Dropdown rows are
 * `gap-1.5 px-1.5 py-1` by default, which reads tighter and shorter.
 */
export const railFlyoutItem = "h-8 gap-2 px-2"
