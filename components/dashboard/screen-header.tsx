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
        <h1 className="text-xl font-semibold tracking-tight">{label}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actions}
    </div>
  )
}
