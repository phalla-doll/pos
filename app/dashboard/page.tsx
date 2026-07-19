import type { Metadata } from "next"
import { Suspense } from "react"

import {
  TabWorkspace,
  TabWorkspaceFallback,
} from "@/components/dashboard/tab-workspace"
import { WORKSPACE_TITLE } from "@/lib/title"

/**
 * The title the route *renders* with. Which screen is focused lives in
 * `?tabs=`/`?i=`, which this page never reads on the server (and couldn't in
 * the static export anyway), so the workspace overrides this from the client
 * as soon as it knows the active tab — see `TabWorkspace`.
 */
export const metadata: Metadata = { title: WORKSPACE_TITLE }

export default function Page() {
  return (
    <Suspense fallback={<TabWorkspaceFallback />}>
      <TabWorkspace />
    </Suspense>
  )
}
