import type { ComponentType } from "react"

import { DashboardScreen } from "@/components/dashboard/dashboard-screen"
import {
  ListScreen,
  type ListScreenConfig,
} from "@/components/dashboard/list-screen"
import { RecordForm } from "@/components/dashboard/record-form"
import { ScreenHeader } from "@/components/dashboard/screen-header"
import { sampleCustomers, sampleInventory } from "@/lib/fixtures"
import { isDraft } from "@/lib/record-param"

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
  Scale,
  CircleDollarSign,
  Timer,
  HardDrive,
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
  /** Stable identifier used in the `?tabs=` search param (the registry key). */
  type: ScreenType
  /** Label shown in the sidebar, the tab bar, and the screen header. */
  label: string
  /** One-line summary shown beneath the title in the screen header. */
  description: string
  /** Icon node rendered next to the label. */
  icon: React.ReactNode
  /** The component rendered inside the tab when this screen is active. */
  component: ComponentType<ScreenProps>
  /**
   * The screen's *parameterized* view, opened as a tab of its own: one record,
   * for creating or editing. Screens without one accept no `param`, and a
   * `?tabs=` token that supplies one anyway falls back to the bare screen.
   *
   * Declared here rather than as separate registry entries because a record
   * form is not a new screen — it is the same screen's columns over one row,
   * and giving it its own entry would put it in the sidebar and the ⌘K
   * palette, where "Inventory record" is not something anyone can open.
   */
  detail?: ScreenDetail
}

/**
 * What the workspace hands every screen it mounts. Both are facts about the
 * *tab*, not the screen — which is why they are props rather than something
 * the registry entry could close over: one registry entry can be open in
 * several tabs at once, and a screen that opens tabs of its own (a list
 * opening a record form) has to name itself to do it.
 *
 * Screens that need neither simply declare no props; a component that ignores
 * its arguments still satisfies the type.
 */
export type ScreenProps = {
  screenType: ScreenType
  tabId: string
}

/** The parameterized half of a {@link Screen}. */
export type ScreenDetail = {
  /** Rendered in place of `component` when the tab carries a param. */
  component: ComponentType<ScreenProps & { param: string }>
  /** Tab-bar label for a param — "New item", or the record's own id. */
  label: (param: string) => string
  /**
   * Whether a param is one this screen can actually show. The URL codec calls
   * it before a token becomes a tab, so junk from a hand-edited link — or a
   * record that no longer exists — is dropped at the boundary rather than
   * mounting a form with nothing behind it.
   */
  accepts: (param: string) => boolean
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
    icon: <Icon strokeWidth={1.5} />,
    component: () => (
      <ScreenPlaceholder label={label} description={description} />
    ),
  }
}

/**
 * Build a registry-driven list screen (filter bar + table). Mirrors
 * {@link screen}'s signature — label, icon, and description are declared once
 * and flow to both the screen metadata and the screen's header.
 *
 * When the config is `creatable` or `editable`, the screen's {@link
 * ScreenDetail} is derived from that same config rather than declared: the
 * form's fields are the list's columns, its records are the list's rows, and
 * its identity check is the list's `rowKey`. Nothing about the record form is
 * stated twice, so a column added to the table appears on the form for free.
 */
function listScreen<T>(
  label: string,
  Icon: LucideIcon,
  description: string,
  config: ListScreenConfig<T>
): ScreenDef {
  const { creatable, editable, noun = "record", rows } = config
  const keyOf = config.rowKey ?? ((_row: T, index: number) => index)
  // Resolved once here so the tab chip and the form's heading can't drift:
  // they are the same phrase in two places, and a user switching between them
  // should not see the tab renamed.
  const draftLabel = config.draftLabel ?? `New ${label}`

  return {
    label,
    description,
    icon: <Icon strokeWidth={1.5} />,
    // No `description`: a list screen draws no title block, so the summary
    // stays where the sidebar and ⌘K read it — on the registry entry above.
    component: (props) => <ListScreen label={label} {...config} {...props} />,
    detail:
      creatable || editable
        ? {
            component: ({ param, tabId }) => (
              <RecordForm
                label={label}
                noun={noun}
                draftLabel={draftLabel}
                columns={config.columns}
                rows={rows}
                rowKey={keyOf}
                param={param}
                tabId={tabId}
              />
            ),
            // A draft is named for the screen it will add to, not for the row
            // noun: "New item" leans on the Inventory tab beside it to say
            // which item, and a chip has to survive being read on its own —
            // in the overflow menu, or as the browser tab's title.
            //
            // An existing record is named by its own id instead, which is
            // shorter and already what the user clicked. Prefixing it with the
            // screen would push the useful half of "Inventory SKU-0001" past
            // the chip's truncation.
            label: (param) => (isDraft(param) ? draftLabel : param),
            // Drafts are accepted only where creating is offered, and record
            // ids only where editing is — and only for a row that is actually
            // there, so a stale link drops the tab instead of opening a form
            // over nothing.
            accepts: (param) =>
              isDraft(param)
                ? Boolean(creatable)
                : Boolean(editable) &&
                  rows.some((row, i) => String(keyOf(row, i)) === param),
          }
        : undefined,
  }
}

/**
 * Build the dashboard overview screen. Mirrors {@link screen} and
 * {@link listScreen}: the label and description are declared once, on the
 * registry entry, and flow to both the screen metadata and its header.
 */
function overviewScreen(
  label: string,
  Icon: LucideIcon,
  description: string
): ScreenDef {
  return {
    label,
    description,
    icon: <Icon strokeWidth={1.5} />,
    component: () => (
      <DashboardScreen label={label} description={description} />
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
  dashboard: overviewScreen(
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
  "scheduled-jobs": screen(
    "Scheduled Jobs",
    Timer,
    "Review the background jobs queued and their run history."
  ),
  "cache-storage": screen(
    "Cache & Storage",
    HardDrive,
    "Inspect cached data and reclaim storage space."
  ),
  "customer-listing": listScreen(
    "Customers",
    ListOrdered,
    "Browse and search all of your customer records.",
    {
      creatable: true,
      editable: true,
      noun: "customer",
      // "New Customers" would claim to be creating several — the label is a
      // plural because the sidebar wants one, and "New …" wants a singular.
      draftLabel: "New customer",
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
  "balance-sheet": screen(
    "Balance Sheet",
    Scale,
    "See assets, liabilities, and equity at a point in time."
  ),
  "cash-flow": screen(
    "Cash Flow",
    CircleDollarSign,
    "Follow cash moving in and out over a period."
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
      editable: true,
      noun: "item",
      rows: sampleInventory,
      rowKey: (item) => item.sku,
      columns: [
        { key: "sku", header: "SKU", get: (i) => i.sku },
        { key: "name", header: "Name", get: (i) => i.name },
        { key: "category", header: "Category", get: (i) => i.category },
        { key: "supplier", header: "Supplier", get: (i) => i.supplier },
        {
          // Left-aligned body with a centred header (the default): the value
          // is "0 bottle", a count plus a unit word, so it reads as a label
          // rather than a figure to line up decimal-wise.
          key: "stock",
          header: "Stock",
          get: (i) => i.stock,
          cell: (i) => `${i.stock} ${i.unit}`,
        },
        {
          key: "price",
          header: "Price",
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
 * Every valid {@link ScreenType}, derived from the registry. This is what the
 * URL layer validates `?tabs=` against, so an unknown screen can never enter
 * tab state — one more thing the registry is the single source of.
 */
export const screenKeys = Object.keys(screenDefs) as readonly ScreenType[]

/**
 * The screen registry keyed by {@link ScreenType}. Each entry is its
 * definition with its `type` injected from the key, so the type string is
 * declared exactly once (as the key) instead of restated per entry.
 */
export const screens: Record<ScreenType, Screen> = Object.fromEntries(
  Object.entries(screenDefs).map(([type, def]) => [type, { ...def, type }])
) as Record<ScreenType, Screen>

/** Look up a screen by one of the values in the `?tabs=` param. */
export function getScreen(type: string | null | undefined): Screen | null {
  if (!type) return null
  return screens[type as ScreenType] ?? null
}
