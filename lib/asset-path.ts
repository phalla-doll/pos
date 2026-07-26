/**
 * URLs for files in `public/`.
 *
 * The GitHub Pages build serves the app under a basePath (`/pos`), and Next
 * rewrites that prefix into `<Link href>` and `next/image` for us — but not
 * into a raw `<img src>`, a `<video src>`, or anything else we hand straight to
 * the DOM. Those 404 in production unless they are prefixed here.
 *
 * `basePath` is declared once in `next.config.ts` and reaches this module as an
 * inlined env var; the parameter exists so the logic stays deterministic and
 * testable without touching `process.env`.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export function assetPath(path: string, prefix: string = basePath): string {
  // Only root-relative paths are ours to prefix: an absolute URL already names
  // its host, and a relative one resolves against the current page either way.
  if (!prefix || !path.startsWith("/")) return path
  return path === prefix || path.startsWith(`${prefix}/`)
    ? path
    : `${prefix}${path}`
}
