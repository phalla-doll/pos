"use client"

import * as React from "react"

import type { TabsApi } from "@/hooks/use-tabs"

/**
 * The workspace's tab API, shared with the screens rendered inside it.
 *
 * This context exists because {@link import("@/hooks/use-tabs").useTabs} holds
 * its identity in `React.useState`: a second caller would get a second,
 * divergent workspace rather than a view of the same one — the exact
 * corruption the id-carrying design exists to prevent. So `TabWorkspace` stays
 * the only caller and passes its one instance down.
 *
 * Screens read it to open tabs of their own — a list opening a record form is
 * the reason it exists — and could not do so by navigating, because they sit
 * *inside* the workspace and a navigation would race the state it owns.
 */
const WorkspaceContext = React.createContext<TabsApi | null>(null)

export function WorkspaceProvider({
  value,
  children,
}: {
  value: TabsApi
  children: React.ReactNode
}) {
  return <WorkspaceContext value={value}>{children}</WorkspaceContext>
}

/**
 * The tab API of the workspace this component is rendered inside, or `null`
 * outside one.
 *
 * Null is a supported answer, not a failure: the sidebar and the ⌘K palette
 * render in the dashboard *layout*, outside the workspace, and reach it by
 * href instead (see `useTabLauncherHref`). A screen that offers a
 * tab-opening affordance should hide it when this returns null rather than
 * throw, so the same component stays renderable in both places.
 */
export function useWorkspace(): TabsApi | null {
  return React.use(WorkspaceContext)
}
