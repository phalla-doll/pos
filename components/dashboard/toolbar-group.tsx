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
 * The `ButtonGroup` a screen's toolbar leads with — the list's Create/View/
 * Delete/More, and the record form's Save/Verify/Hold/Clear/More. One
 * component rather than the class string twice: the two rows are meant to read
 * as the same control seen at two altitudes, and the selectors below are not
 * the kind of thing that stays in step by hand.
 *
 * What it adds to the vendored group is the pill. `buttonGroupVariants` rounds
 * the run's two ends to `lg`, the Button's own radius, so a group comes out
 * the same shape as the buttons in it; this takes the *outer* corners to
 * `full` and leaves the seams between the buttons square, so the run still
 * reads as one segmented control rather than as a line of separate pills.
 *
 * Done here at the call-site layer because `components/ui` is vendored. The
 * selectors are the vendor's own: an end is whatever the group currently
 * treats as one, which matters because both toolbars render their buttons
 * conditionally and neither end is always the same button. The `!` is what it
 * takes to beat the `rounded-r-lg!` this replaces.
 */
export function ToolbarGroup({
  className,
  ...props
}: React.ComponentProps<typeof ButtonGroup>) {
  return <ButtonGroup className={cn(TOOLBAR_PILL, className)} {...props} />
}
