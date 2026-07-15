import type { ComponentType } from "react"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  Package01Icon,
  ShoppingCart01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"

/**
 * A screen is a unit of dashboard content that can be opened in a tab.
 * Each screen type maps to exactly one label, icon, and component.
 *
 * To add a new tab-able screen, append an entry here — the sidebar,
 * tab bar, and workspace all read from this registry.
 */
export type ScreenType = "overview" | "products" | "orders" | "customers"

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

export const screens: Record<ScreenType, Screen> = {
  overview: {
    type: "overview",
    label: "Overview",
    icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
    component: () => <ScreenPlaceholder label="Overview" />,
  },
  products: {
    type: "products",
    label: "Products",
    icon: <HugeiconsIcon icon={Package01Icon} strokeWidth={2} />,
    component: () => <ScreenPlaceholder label="Products" />,
  },
  orders: {
    type: "orders",
    label: "Orders",
    icon: <HugeiconsIcon icon={ShoppingCart01Icon} strokeWidth={2} />,
    component: () => <ScreenPlaceholder label="Orders" />,
  },
  customers: {
    type: "customers",
    label: "Customers",
    icon: <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} />,
    component: () => <ScreenPlaceholder label="Customers" />,
  },
}

/** Screens that appear as top-level launchers in the sidebar, in order. */
export const sidebarScreens: Screen[] = [
  screens.overview,
  screens.products,
  screens.orders,
  screens.customers,
]

/** Look up a screen by the value of the `?tab=` param. */
export function getScreen(type: string | null | undefined): Screen | null {
  if (!type) return null
  return screens[type as ScreenType] ?? null
}
