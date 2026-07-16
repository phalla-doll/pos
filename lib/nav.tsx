import { BookOpen, Server, Users, Wallet, Wrench } from "lucide-react"

import { screens, type Screen, type ScreenType } from "@/lib/screens"

/**
 * A sidebar nav entry is either a single tab launcher (`screen`) or a
 * collapsible `group`. A group is not tab-able itself — it only expands
 * to reveal its children, which are themselves nav entries. Because
 * children are `NavEntry[]`, groups can nest to any depth (the sidebar
 * renders each level recursively), giving 3-level menus and beyond.
 */
export type NavEntry =
  | { kind: "screen"; screen: Screen }
  | {
      kind: "group"
      label: string
      icon: React.ReactNode
      children: NavEntry[]
    }

const s = screens

/** Wrap a screen as a leaf nav entry (a tab launcher). */
const leaf = (screen: Screen): NavEntry => ({ kind: "screen", screen })

/** Build a collapsible group nav entry from a label, icon, and children. */
const group = (
  label: string,
  icon: React.ReactNode,
  children: NavEntry[]
): NavEntry => ({ kind: "group", label, icon, children })

/** The sidebar nav tree, in display order (matches the Platform menu). */
export const sidebarNav: NavEntry[] = [
  leaf(s.dashboard),
  leaf(s.pos),
  group("Admin Tools", <Wrench strokeWidth={2} />, [
    leaf(s.users),
    leaf(s.roles),
    leaf(s.permissions),
    // 3-level: Admin Tools › System › { Audit Logs, Backups }
    group("System", <Server strokeWidth={2} />, [
      leaf(s["audit-logs"]),
      leaf(s.backups),
    ]),
  ]),
  group("Customers", <Users strokeWidth={2} />, [
    leaf(s["customer-listing"]),
    leaf(s["customer-owed"]),
    leaf(s["customer-history"]),
  ]),
  group("Reports", <BookOpen strokeWidth={2} />, [
    leaf(s["best-sales"]),
    leaf(s["summary-report"]),
    leaf(s["income-report"]),
    // 3-level: Reports › Financials › { Tax Report, Profit & Loss }
    group("Financials", <Wallet strokeWidth={2} />, [
      leaf(s["tax-report"]),
      leaf(s["profit-loss"]),
    ]),
  ]),
  leaf(s.suppliers),
  leaf(s.inventory),
  leaf(s.settings),
]

/** Every screen type referenced by the nav tree, in traversal order. */
export function collectScreenTypes(nav: NavEntry[]): ScreenType[] {
  const out: ScreenType[] = []
  const walk = (entries: NavEntry[]) => {
    for (const entry of entries) {
      if (entry.kind === "screen") out.push(entry.screen.type)
      else walk(entry.children)
    }
  }
  walk(nav)
  return out
}

/**
 * Check the registry ↔ nav invariant: every screen is reachable from the nav
 * exactly once. Returns the screens missing from the nav (`unreachable`) and
 * any listed more than once (`duplicated`). Pure and data-only, so it is
 * unit-testable and can guard the real tree in a test.
 */
export function findNavIssues(
  allTypes: readonly ScreenType[],
  nav: NavEntry[]
): { unreachable: ScreenType[]; duplicated: ScreenType[] } {
  const listed = collectScreenTypes(nav)
  const counts = new Map<ScreenType, number>()
  for (const type of listed) counts.set(type, (counts.get(type) ?? 0) + 1)
  const duplicated = [...counts].filter(([, n]) => n > 1).map(([type]) => type)
  const reachable = new Set(listed)
  const unreachable = allTypes.filter((type) => !reachable.has(type))
  return { unreachable, duplicated }
}
