/**
 * The browser tab title — stated once, used from both sides.
 *
 * Next builds titles from a `template` in the root layout's metadata, which
 * only applies to titles set by *route* segments. The dashboard's title isn't
 * one: the workspace is a single route whose active screen changes via a
 * shallow `?tabs=` write, so no navigation happens and no metadata re-runs.
 * The client sets `document.title` itself (see `hooks/use-document-title.ts`).
 *
 * So the template lives here as data, `titleTemplate` feeds Next's metadata and
 * {@link documentTitle} applies it by hand — one rule, two consumers, rather
 * than a literal restated in each.
 */

/** The product name, as it appears at the end of every title. */
export const APP_NAME = "Acme Inc"

/** Next's `metadata.title.template` — `%s` is the page's own title. */
export const titleTemplate = `%s · ${APP_NAME}`

/** What the workspace is called when no screen is open. */
export const WORKSPACE_TITLE = "Workspace"

/**
 * The full document title for a page title, e.g. `"Inventory"` →
 * `"Inventory · Acme Inc"`. A missing or blank title falls back to the app
 * name alone, so the tab never reads `" · Acme Inc"`.
 */
export function documentTitle(title: string | null | undefined): string {
  const trimmed = title?.trim()
  if (!trimmed) return APP_NAME
  return titleTemplate.replace("%s", trimmed)
}

/**
 * The document title for the workspace with `screenLabel` focused — the label
 * of the active screen, or {@link WORKSPACE_TITLE} when nothing is open.
 */
export function workspaceTitle(screenLabel: string | null | undefined): string {
  return documentTitle(screenLabel?.trim() || WORKSPACE_TITLE)
}
