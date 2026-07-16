import type { ComponentType } from "react"

import {
  ListScreen,
  type ListScreenConfig,
} from "@/components/dashboard/list-screen"
import { ScreenHeader } from "@/components/dashboard/screen-header"
import { sampleCustomers, sampleInventory } from "@/lib/fixtures"

import {
  Landmark,
  ShoppingBasket,
  Users,
  SlidersHorizontal,
  ListChecks,
  ListOrdered,
  Banknote,
  History,
  ChartColumn,
  ArrowRightLeft,
  ReceiptText,
  Truck,
  Warehouse,
  Settings,
  ScrollText,
  DatabaseBackup,
  Percent,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

/**
 * A screen is a unit of dashboard content that can be opened in a tab.
 * Each screen type maps to exactly one label, icon, and component.
 *
 * To add a new tab-able screen, append one entry to {@link screens} below —
 * its key becomes the {@link ScreenType}, and the sidebar nav derives from it.
 * There is no separate union or record type to keep in sync.
 */
export type Screen = {
  /** Stable identifier used in the `?tab=` search param (the registry key). */
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

/** A screen definition without its `type` — the registry key supplies that. */
type ScreenDef = Omit<Screen, "type">

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
      <ScreenHeader label={label} description={description} />
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
  label: string,
  Icon: LucideIcon,
  description: string
): ScreenDef {
  return {
    label,
    description,
    icon: <Icon strokeWidth={2} />,
    component: () => (
      <ScreenPlaceholder label={label} description={description} />
    ),
  }
}

/**
 * Build a registry-driven list screen (filter bar + table). Mirrors
 * {@link screen}'s signature — label, icon, and description are declared once
 * and flow to both the screen metadata and the screen's header.
 */
function listScreen<T>(
  label: string,
  Icon: LucideIcon,
  description: string,
  config: ListScreenConfig<T>
): ScreenDef {
  return {
    label,
    description,
    icon: <Icon strokeWidth={2} />,
    component: () => (
      <ListScreen label={label} description={description} {...config} />
    ),
  }
}

/**
 * The screen registry — the single source of truth. Keys are the screen
 * types; {@link ScreenType} is derived from them, and the sidebar nav in
 * `@/lib/nav` is validated against this record. `satisfies` keeps each entry
 * type-checked as a {@link ScreenDef} while preserving the literal keys.
 */
const screenDefs = {
  dashboard: screen(
    "Dashboard",
    Landmark,
    "An overview of sales, activity, and key metrics at a glance."
  ),
  pos: screen(
    "POS Screen",
    ShoppingBasket,
    "Ring up sales and process transactions at the register."
  ),
  users: screen(
    "Users",
    Users,
    "Manage staff accounts and their access to the system."
  ),
  roles: screen(
    "Roles",
    SlidersHorizontal,
    "Define roles and the permissions assigned to each."
  ),
  permissions: screen(
    "Permissions",
    ListChecks,
    "Configure the granular permissions available across the system."
  ),
  "audit-logs": screen(
    "Audit Logs",
    ScrollText,
    "Track every action taken across the system."
  ),
  backups: screen(
    "Backups",
    DatabaseBackup,
    "Create and restore backups of your data."
  ),
  "customer-listing": listScreen(
    "Customer Listing",
    ListOrdered,
    "Browse and search all of your customer records.",
    {
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
    }
  ),
  "customer-owed": screen(
    "Customer Owed",
    Banknote,
    "See which customers have outstanding balances."
  ),
  "customer-history": screen(
    "Customer History",
    History,
    "Review past purchases and activity for each customer."
  ),
  "best-sales": screen(
    "Best Sales",
    ChartColumn,
    "Discover your top-selling products and trends."
  ),
  "summary-report": screen(
    "Summary Report",
    ArrowRightLeft,
    "A consolidated summary of sales and activity."
  ),
  "income-report": screen(
    "Income Report",
    ReceiptText,
    "Track revenue and income over time."
  ),
  "tax-report": screen(
    "Tax Report",
    Percent,
    "Review the tax collected across transactions."
  ),
  "profit-loss": screen(
    "Profit & Loss",
    TrendingUp,
    "Compare revenue against costs to see profitability."
  ),
  suppliers: screen(
    "Suppliers",
    Truck,
    "Manage your suppliers and their contact details."
  ),
  inventory: listScreen(
    "Inventory",
    Warehouse,
    "Track stock levels, pricing, and product details.",
    {
      creatable: true,
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
    }
  ),
  settings: screen(
    "Settings",
    Settings,
    "Configure system preferences and options."
  ),
} satisfies Record<string, ScreenDef>

/** Stable identifier for a screen — derived from the registry keys. */
export type ScreenType = keyof typeof screenDefs

/**
 * The screen registry keyed by {@link ScreenType}. Each entry is its
 * definition with its `type` injected from the key, so the type string is
 * declared exactly once (as the key) instead of restated per entry.
 */
export const screens: Record<ScreenType, Screen> = Object.fromEntries(
  Object.entries(screenDefs).map(([type, def]) => [type, { ...def, type }])
) as Record<ScreenType, Screen>

/** Look up a screen by the value of the `?tab=` param. */
export function getScreen(type: string | null | undefined): Screen | null {
  if (!type) return null
  return screens[type as ScreenType] ?? null
}
