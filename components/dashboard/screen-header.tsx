/**
 * The title/description header shown at the top of every screen — the single
 * source for that markup, shared by the placeholder screens and the list
 * screens. `actions` fills an optional right-aligned slot (e.g. a results
 * count); with none, the title block sits alone on the left.
 */
export function ScreenHeader({
  label,
  description,
  actions,
}: {
  label: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        {/* Dark mode brightens the title off `--primary` rather than using it
            directly: the dark token sits at L 0.424, tuned to carry white
            `--primary-foreground` on a filled button, which leaves it too dim
            to read as *text* against an L 0.145 background. Same hue, lifted
            lightness — a call-site override so buttons keep the real token. */}
        <h1 className="text-2xl font-semibold tracking-tight text-primary dark:text-[oklch(0.72_0.18_265.638)]">
          {label}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actions}
    </div>
  )
}
