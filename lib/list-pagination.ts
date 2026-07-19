/**
 * Paging arithmetic for the list screens: which slice of the rows a page
 * covers, and which page numbers the pager should offer.
 *
 * Everything here is derived rather than stored. The screen keeps only the
 * requested page and page size; {@link paginate} turns those plus a row count
 * into the clamped truth. That is what lets a filter shrink the results
 * without any resetting effect — asking for page 7 of a 2-page list simply
 * answers page 2, so there is no stale page to correct after the fact.
 */

/** The page sizes offered in the footer's picker. */
export const pageSizes = [10, 25, 50, 100] as const

export type PageSize = (typeof pageSizes)[number]

/** The default page size — big enough to fill a screen, small enough to page. */
export const defaultPageSize: PageSize = 25

export type Pagination = {
  /** The effective page, 1-based and clamped into `[1, pageCount]`. */
  page: number
  /** Total pages, never below 1 so an empty list still has a page 1. */
  pageCount: number
  /** Slice bounds into the full row list: `rows.slice(start, end)`. */
  start: number
  end: number
  /**
   * Human-facing 1-based bounds for "Showing 26–50 of 137". Both are 0 when
   * there is nothing to show, so the caller can render "0 of 0" without
   * special-casing an empty list into negative or reversed numbers.
   */
  from: number
  to: number
  /** The unpaged row count this was derived from. */
  total: number
}

/**
 * Resolve a requested page against reality. `page` and `size` are taken as
 * requests, not facts: both are clamped, so out-of-range input from a stale
 * page number or a hand-edited size can't produce a slice off the end of the
 * rows.
 */
export function paginate(
  total: number,
  page: number,
  size: number
): Pagination {
  const safeTotal = Math.max(0, Math.floor(total))
  const safeSize = Math.max(1, Math.floor(size))
  const pageCount = Math.max(1, Math.ceil(safeTotal / safeSize))
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), pageCount)

  const start = (safePage - 1) * safeSize
  const end = Math.min(start + safeSize, safeTotal)

  return {
    page: safePage,
    pageCount,
    start,
    end,
    // An empty list has no first item, so it reads "0–0" rather than "1–0".
    from: safeTotal === 0 ? 0 : start + 1,
    to: end,
    total: safeTotal,
  }
}

/** The rows a {@link Pagination} covers. */
export function pageSlice<T>(rows: T[], page: Pagination): T[] {
  return rows.slice(page.start, page.end)
}

/**
 * Keep the reader roughly in place when the page size changes. Jumping back to
 * page 1 would throw away their position; instead the item currently at the
 * top of the page is found again under the new size.
 */
export function rescalePage(
  page: number,
  oldSize: number,
  newSize: number
): number {
  const firstIndex = (Math.max(1, Math.floor(page) || 1) - 1) * oldSize
  return Math.floor(firstIndex / Math.max(1, newSize)) + 1
}

/** A slot in the pager: a page number, or a break standing for skipped pages. */
export type PageSlot = number | "gap"

/**
 * The page numbers to render, always as at most {@link windowSize} slots so
 * the pager doesn't change width as the user moves through it. Beyond that
 * many pages it keeps the first, the last, and the current page's immediate
 * neighbours, replacing the runs between them with a gap.
 */
export const windowSize = 7

export function pageWindow(page: number, pageCount: number): PageSlot[] {
  const total = Math.max(1, Math.floor(pageCount))
  const current = Math.min(Math.max(1, Math.floor(page) || 1), total)

  if (total <= windowSize) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  // Near either end there is no run to elide on that side, so the freed slots
  // go to showing more consecutive pages rather than to a second gap.
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "gap", total]
  }
  if (current >= total - 3) {
    return [1, "gap", total - 4, total - 3, total - 2, total - 1, total]
  }
  return [1, "gap", current - 1, current, current + 1, "gap", total]
}
