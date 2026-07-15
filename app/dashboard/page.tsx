import { Suspense } from "react"

import {
  TabWorkspace,
  TabWorkspaceFallback,
} from "@/components/dashboard/tab-workspace"

export default function Page() {
  return (
    <Suspense fallback={<TabWorkspaceFallback />}>
      <TabWorkspace />
    </Suspense>
  )
}
