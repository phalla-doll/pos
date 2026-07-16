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
  Server,
  ScrollText,
  DatabaseBackup,
  Wallet,
  Percent,
  TrendingUp,
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
  | "audit-logs"
  | "backups"
  | "customer-listing"
  | "customer-owed"
  | "customer-history"
  | "best-sales"
  | "summary-report"
  | "income-report"
  | "tax-report"
  | "profit-loss"
  | "suppliers"
  | "inventory"
  | "settings"

export type Screen = {
  /** Stable identifier used in the `?tab=` search param. */
  type: ScreenType
  /** Label shown in the sidebar, the tab bar, and the screen header. */
  label: string
  /** One-line summary shown beneath the title in the screen header. */
  description: string
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
function ScreenPlaceholder({
  label,
  description,
}: {
  label: string
  description: string
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
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
  description: string
): Screen {
  return {
    type,
    label,
    description,
    icon: <Icon strokeWidth={2} />,
    component: () => (
      <ScreenPlaceholder label={label} description={description} />
    ),
  }
}

/**
 * Build a registry-driven list screen (filter bar + table) from a
 * {@link ListScreenConfig}. The screen's label comes from `config.title`.
 */
function listScreen<T>(
  type: ScreenType,
  Icon: LucideIcon,
  config: ListScreenConfig<T>
): Screen {
  return {
    type,
    label: config.title,
    description: config.description,
    icon: <Icon strokeWidth={2} />,
    component: () => <ListScreen {...config} />,
  }
}

export const screens: Record<ScreenType, Screen> = {
  dashboard: screen(
    "dashboard",
    "Dashboard",
    Landmark,
    "An overview of sales, activity, and key metrics at a glance."
  ),
  pos: screen(
    "pos",
    "POS Screen",
    ShoppingBasket,
    "Ring up sales and process transactions at the register."
  ),
  users: screen(
    "users",
    "Users",
    Users,
    "Manage staff accounts and their access to the system."
  ),
  roles: screen(
    "roles",
    "Roles",
    SlidersHorizontal,
    "Define roles and the permissions assigned to each."
  ),
  permissions: screen(
    "permissions",
    "Permissions",
    ListChecks,
    "Configure the granular permissions available across the system."
  ),
  "audit-logs": screen(
    "audit-logs",
    "Audit Logs",
    ScrollText,
    "Track every action taken across the system."
  ),
  backups: screen(
    "backups",
    "Backups",
    DatabaseBackup,
    "Create and restore backups of your data."
  ),
  "customer-listing": listScreen("customer-listing", ListOrdered, {
    title: "Customer Listing",
    description: "Browse and search all of your customer records.",
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
  "customer-owed": screen(
    "customer-owed",
    "Customer Owed",
    Banknote,
    "See which customers have outstanding balances."
  ),
  "customer-history": screen(
    "customer-history",
    "Customer History",
    History,
    "Review past purchases and activity for each customer."
  ),
  "best-sales": screen(
    "best-sales",
    "Best Sales",
    ChartColumn,
    "Discover your top-selling products and trends."
  ),
  "summary-report": screen(
    "summary-report",
    "Summary Report",
    ArrowRightLeft,
    "A consolidated summary of sales and activity."
  ),
  "income-report": screen(
    "income-report",
    "Income Report",
    ReceiptText,
    "Track revenue and income over time."
  ),
  "tax-report": screen(
    "tax-report",
    "Tax Report",
    Percent,
    "Review the tax collected across transactions."
  ),
  "profit-loss": screen(
    "profit-loss",
    "Profit & Loss",
    TrendingUp,
    "Compare revenue against costs to see profitability."
  ),
  suppliers: screen(
    "suppliers",
    "Suppliers",
    Truck,
    "Manage your suppliers and their contact details."
  ),
  inventory: listScreen("inventory", Warehouse, {
    title: "Inventory",
    description: "Track stock levels, pricing, and product details.",
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
  settings: screen(
    "settings",
    "Settings",
    Settings,
    "Configure system preferences and options."
  ),
}

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

/** Look up a screen by the value of the `?tab=` param. */
export function getScreen(type: string | null | undefined): Screen | null {
  if (!type) return null
  return screens[type as ScreenType] ?? null
}
