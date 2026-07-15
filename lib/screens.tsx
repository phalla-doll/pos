import type { ComponentType } from "react"

import {
  ListScreen,
  type ListScreenConfig,
} from "@/components/dashboard/list-screen"
import { sampleCustomers, sampleInventory } from "@/lib/sample-data"

import {
  Landmark,
  ShoppingBasket,
  Wrench,
  Users,
  SlidersHorizontal,
  ListChecks,
  ListOrdered,
  Banknote,
  History,
  BookOpen,
  ChartColumn,
  ArrowRightLeft,
  ReceiptText,
  Truck,
  Warehouse,
  Settings,
  type LucideIcon,
} from "lucide-react"

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
  Icon: LucideIcon,
): Screen {
  return {
    type,
    label,
    icon: <Icon strokeWidth={2} />,
    component: () => <ScreenPlaceholder label={label} />,
  }
}

/**
 * Build a registry-driven list screen (filter bar + table) from a
 * {@link ListScreenConfig}. The screen's label comes from `config.title`.
 */
function listScreen<T>(
  type: ScreenType,
  Icon: LucideIcon,
  config: ListScreenConfig<T>,
): Screen {
  return {
    type,
    label: config.title,
    icon: <Icon strokeWidth={2} />,
    component: () => <ListScreen {...config} />,
  }
}

export const screens: Record<ScreenType, Screen> = {
  dashboard: screen("dashboard", "Dashboard", Landmark),
  pos: screen("pos", "POS Screen", ShoppingBasket),
  users: screen("users", "Users", Users),
  roles: screen("roles", "Roles", SlidersHorizontal),
  permissions: screen("permissions", "Permissions", ListChecks),
  "customer-listing": listScreen("customer-listing", ListOrdered, {
    title: "Customer Listing",
    rows: sampleCustomers,
    rowKey: (row) => row.id,
    columns: [
      { key: "id", header: "Customer ID", get: (c) => c.id },
      { key: "name", header: "Name", get: (c) => c.name },
      { key: "phone", header: "Phone", get: (c) => c.phone },
      { key: "city", header: "City", get: (c) => c.city },
      { key: "status", header: "Status", get: (c) => c.status },
      {
        key: "balance",
        header: "Balance",
        align: "right",
        get: (c) => c.balance,
        cell: (c) => `$${c.balance.toFixed(2)}`,
      },
    ],
  }),
  "customer-owed": screen("customer-owed", "Customer Owed", Banknote),
  "customer-history": screen(
    "customer-history",
    "Customer History",
    History,
  ),
  "best-sales": screen("best-sales", "Best Sales", ChartColumn),
  "summary-report": screen("summary-report", "Summary Report", ArrowRightLeft),
  "income-report": screen("income-report", "Income Report", ReceiptText),
  suppliers: screen("suppliers", "Suppliers", Truck),
  inventory: listScreen("inventory", Warehouse, {
    title: "Inventory",
    rows: sampleInventory,
    rowKey: (item) => item.sku,
    columns: [
      { key: "sku", header: "SKU", get: (i) => i.sku },
      { key: "name", header: "Name", get: (i) => i.name },
      { key: "category", header: "Category", get: (i) => i.category },
      { key: "supplier", header: "Supplier", get: (i) => i.supplier },
      {
        key: "stock",
        header: "Stock",
        align: "right",
        get: (i) => i.stock,
        cell: (i) => `${i.stock} ${i.unit}`,
      },
      {
        key: "price",
        header: "Price",
        align: "right",
        get: (i) => i.price,
        cell: (i) => `$${i.price.toFixed(2)}`,
      },
      { key: "status", header: "Status", get: (i) => i.status },
    ],
  }),
  settings: screen("settings", "Settings", Settings),
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
    icon: <Wrench strokeWidth={2} />,
    children: [s.users, s.roles, s.permissions],
  },
  {
    kind: "group",
    label: "Customers",
    icon: <Users strokeWidth={2} />,
    children: [s["customer-listing"], s["customer-owed"], s["customer-history"]],
  },
  {
    kind: "group",
    label: "Reports",
    icon: <BookOpen strokeWidth={2} />,
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
