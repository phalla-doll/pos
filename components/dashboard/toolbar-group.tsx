import { ButtonGroup } from "@/components/ui/button-group"
import { cn } from "@/lib/utils"

/**
 * The pill, as the two ends of a run.
 *
 * `rounded-full` on the group's wrapper would do nothing: that `div` has no
 * background and no border — the buttons draw all of it — so the radius has to
 * land on the buttons themselves. Not exported: a lone button beside a group
 * is both ends at once and takes a plain `rounded-full` instead, which is what
 * `record-form.tsx`'s Close does.
 */
const TOOLBAR_PILL =
  "[&>[data-slot]:first-child]:rounded-l-full [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-full!"

/**
 * The seams, as the surface showing through.
 *
 * `buttonGroupVariants` collapses each button's left border to nothing so the
 * run doesn't draw doubled edges, and on `outline` that was the whole story —
 * the seam you saw was the *remaining* border of the button to its left. The
 * toolbars are `secondary` now, whose border is the Button base's transparent
 * one, so collapsing it left the run a single unbroken fill.
 *
 * Restoring the width is all it takes: the Button base is `bg-clip-padding`,
 * so its background stops at the padding box and a transparent border is a
 * gap, not a line. What comes through is whatever the group is sitting on —
 * the card under the list's toolbar, the page under the record form's.
 *
 * Which is why no colour is named here. `--border` is tuned for a hairline
 * against a card and lands almost exactly on `--secondary` once dark mode
 * composites its 10% white, so the seams would have all but vanished in the
 * theme they need to be clearest in. A gap can't have that problem:
 * `--secondary` stands off its surface in *both* themes, lighter in one and
 * darker in the other, so the seam follows it either way. The one thing this
 * can't survive is a group on a surface its own colour — not somewhere either
 * toolbar goes.
 *
 * The `!` beats the vendor's `border-l-0`, which is the same specificity and
 * would otherwise win or lose on stylesheet order.
 */
const TOOLBAR_SEAMS = "[&>[data-slot]~[data-slot]]:border-l!"

/**
 * The `ButtonGroup` a screen's toolbar leads with — the list's Create/View/
 * Delete/More, and the record form's Save/Verify/Hold/Clear/More. One
 * component rather than the class string twice: the two rows are meant to read
 * as the same control seen at two altitudes, and the selectors below are not
 * the kind of thing that stays in step by hand.
 *
 * What it adds to the vendored group is the pill and the seams — the run's two
 * ends and the joins between them, which are the two things that decide
 * whether a row of buttons reads as one control. `buttonGroupVariants` rounds
 * the ends to `lg`, the Button's own radius, so a group comes out the same
 * shape as the buttons in it; this takes the *outer* corners to `full` and
 * leaves the inner ones square, so the run still reads as one segmented
 * control rather than as a line of separate pills. `TOOLBAR_SEAMS` puts the
 * divisions back inside it.
 *
 * Done here at the call-site layer because `components/ui` is vendored. The
 * selectors are the vendor's own: an end is whatever the group currently
 * treats as one, which matters because both toolbars render their buttons
 * conditionally and neither end is always the same button. The `!` on the
 * radius is what it takes to beat the `rounded-r-lg!` it replaces.
 */
export function ToolbarGroup({
  className,
  ...props
}: React.ComponentProps<typeof ButtonGroup>) {
  return (
    <ButtonGroup
      className={cn(TOOLBAR_PILL, TOOLBAR_SEAMS, className)}
      {...props}
    />
  )
}
