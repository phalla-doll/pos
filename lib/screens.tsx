import type { ComponentType } from "react"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  BankIcon,
  ShoppingBasket01Icon,
  ToolsIcon,
  UserGroupIcon,
  SlidersHorizontalIcon,
  CheckListIcon,
  UserMultiple02Icon,
  LeftToRightListNumberIcon,
  Money01Icon,
  HistoryIcon,
  BookOpen01Icon,
  Analytics01Icon,
  Exchange01Icon,
  Invoice01Icon,
  DeliveryTruck01Icon,
  WarehouseIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"

/**
 * A screen is a unit of dashboard content that can be opened in a tab.
 * Each screen type maps to exactly one label, icon, and component.
 *
 * To add a new tab-able screen, append an entry here — the sidebar,
 * tab bar, and workspace all read from this registry.
 */
export type ScreenType =
  | "dashboard"
  | "pos"
  | "users"
  | "roles"
  | "permissions"
  | "customer-listing"
  | "customer-owed"
  | "customer-history"
  | "best-sales"
  | "summary-report"
  | "income-report"
  | "suppliers"
  | "inventory"
  | "settings"

export type Screen = {
  /** Stable identifier used in the `?tab=` search param. */
  type: ScreenType
  /** Label shown in the sidebar, the tab bar, and the screen header. */
  label: string
  /** Icon node rendered next to the label. */
  icon: React.ReactNode
  /** The component rendered inside the tab when this screen is active. */
  component: ComponentType
}

/**
 * Placeholder screen content. Every screen shares this skeleton so the
 * tabbed workspace has something to show until real screens are built.
 * Each instance gets a fresh `key` from the workspace, so navigating
 * away and back always remounts it (per the fresh-remount requirement).
 */
function ScreenPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
      <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-[60vh] flex-1 rounded-xl bg-muted/50" />
    </div>
  )
}

/** Build a screen backed by the shared placeholder. */
function screen(
  type: ScreenType,
  label: string,
  icon: typeof BankIcon,
): Screen {
  return {
    type,
    label,
    icon: <HugeiconsIcon icon={icon} strokeWidth={2} />,
    component: () => <ScreenPlaceholder label={label} />,
  }
}

export const screens: Record<ScreenType, Screen> = {
  dashboard: screen("dashboard", "Dashboard", BankIcon),
  pos: screen("pos", "POS Screen", ShoppingBasket01Icon),
  users: screen("users", "Users", UserGroupIcon),
  roles: screen("roles", "Roles", SlidersHorizontalIcon),
  permissions: screen("permissions", "Permissions", CheckListIcon),
  "customer-listing": screen(
    "customer-listing",
    "Customer Listing",
    LeftToRightListNumberIcon,
  ),
  "customer-owed": screen("customer-owed", "Customer Owed", Money01Icon),
  "customer-history": screen(
    "customer-history",
    "Customer History",
    HistoryIcon,
  ),
  "best-sales": screen("best-sales", "Best Sales", Analytics01Icon),
  "summary-report": screen("summary-report", "Summary Report", Exchange01Icon),
  "income-report": screen("income-report", "Income Report", Invoice01Icon),
  suppliers: screen("suppliers", "Suppliers", DeliveryTruck01Icon),
  inventory: screen("inventory", "Inventory", WarehouseIcon),
  settings: screen("settings", "Settings", Settings02Icon),
}

/**
 * A sidebar nav entry is either a single tab launcher (`screen`) or a
 * collapsible `group` whose children are launchers. Groups are not
 * tab-able themselves — they only expand to reveal their child screens.
 */
export type NavEntry =
  | { kind: "screen"; screen: Screen }
  | { kind: "group"; label: string; icon: React.ReactNode; children: Screen[] }

const s = screens

/** The sidebar nav tree, in display order (matches the Platform menu). */
export const sidebarNav: NavEntry[] = [
  { kind: "screen", screen: s.dashboard },
  { kind: "screen", screen: s.pos },
  {
    kind: "group",
    label: "Admin Tools",
    icon: <HugeiconsIcon icon={ToolsIcon} strokeWidth={2} />,
    children: [s.users, s.roles, s.permissions],
  },
  {
    kind: "group",
    label: "Customers",
    icon: <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2} />,
    children: [s["customer-listing"], s["customer-owed"], s["customer-history"]],
  },
  {
    kind: "group",
    label: "Reports",
    icon: <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />,
    children: [s["best-sales"], s["summary-report"], s["income-report"]],
  },
  { kind: "screen", screen: s.suppliers },
  { kind: "screen", screen: s.inventory },
  { kind: "screen", screen: s.settings },
]

/** Look up a screen by the value of the `?tab=` param. */
export function getScreen(type: string | null | undefined): Screen | null {
  if (!type) return null
  return screens[type as ScreenType] ?? null
}
