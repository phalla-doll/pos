"use client"

import * as React from "react"

/**
 * Keep `document.title` in sync with `title`.
 *
 * A thin adapter — the title string itself is composed by the pure helpers in
 * `@/lib/title`. This exists because the workspace changes screens without
 * navigating (a shallow `?tabs=` write), so Next's metadata never re-runs and
 * the tab title would otherwise stay on whatever the route rendered with.
 */
export function useDocumentTitle(title: string) {
  React.useEffect(() => {
    document.title = title
  }, [title])
}
