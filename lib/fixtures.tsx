/**
 * The single home for mock/fixture data — the list-screen rows below plus the
 * sidebar's user and teams. Everything here stands in for real data until the
 * app is wired to a backend, so a future swap is a one-module change.
 */

import { BrandMark } from "@/components/brand-mark"

export type Customer = {
  id: string
  name: string
  phone: string
  city: string
  status: "Active" | "Inactive"
  balance: number
}

export type InventoryItem = {
  sku: string
  name: string
  category: string
  supplier: string
  stock: number
  unit: string
  /** Retail price per unit. */
  price: number
  /** What we pay the supplier per unit — the basis for margin. */
  cost: number
  status: "In Stock" | "Low Stock" | "Out of Stock"
}

export const sampleInventory: InventoryItem[] = [
  {
    sku: "SKU-0001",
    name: "Coca-Cola 330ml",
    category: "Beverages",
    supplier: "Cambrew Ltd",
    stock: 240,
    unit: "can",
    price: 0.75,
    cost: 0.54,
    status: "In Stock",
  },
  {
    sku: "SKU-0002",
    name: "Angkor Beer 330ml",
    category: "Beverages",
    supplier: "Cambrew Ltd",
    stock: 18,
    unit: "can",
    price: 0.9,
    cost: 0.68,
    status: "Low Stock",
  },
  {
    sku: "SKU-0003",
    name: "Jasmine Rice 5kg",
    category: "Grocery",
    supplier: "Golden Rice Co",
    stock: 60,
    unit: "bag",
    price: 8.5,
    cost: 7.1,
    status: "In Stock",
  },
  {
    sku: "SKU-0004",
    name: "Fish Sauce 500ml",
    category: "Grocery",
    supplier: "Sea Taste",
    stock: 0,
    unit: "bottle",
    price: 1.4,
    cost: 0.95,
    status: "Out of Stock",
  },
  {
    sku: "SKU-0005",
    name: "Instant Noodles",
    category: "Grocery",
    supplier: "Mama Foods",
    stock: 320,
    unit: "pack",
    price: 0.35,
    cost: 0.24,
    status: "In Stock",
  },
  {
    sku: "SKU-0006",
    name: "Cooking Oil 1L",
    category: "Grocery",
    supplier: "Sea Taste",
    stock: 12,
    unit: "bottle",
    price: 2.1,
    cost: 1.65,
    status: "Low Stock",
  },
  {
    sku: "SKU-0007",
    name: "Toothpaste 100g",
    category: "Personal Care",
    supplier: "Colgate KH",
    stock: 85,
    unit: "tube",
    price: 1.25,
    cost: 0.72,
    status: "In Stock",
  },
  {
    sku: "SKU-0008",
    name: "Bath Soap",
    category: "Personal Care",
    supplier: "Colgate KH",
    stock: 5,
    unit: "bar",
    price: 0.6,
    cost: 0.33,
    status: "Low Stock",
  },
  {
    sku: "SKU-0009",
    name: "Potato Chips 60g",
    category: "Snacks",
    supplier: "Mama Foods",
    stock: 0,
    unit: "pack",
    price: 0.8,
    cost: 0.46,
    status: "Out of Stock",
  },
  {
    sku: "SKU-0010",
    name: "Mineral Water 1.5L",
    category: "Beverages",
    supplier: "Cambrew Ltd",
    stock: 150,
    unit: "bottle",
    price: 0.5,
    cost: 0.34,
    status: "In Stock",
  },
  {
    sku: "SKU-0011",
    name: "Sugar 1kg",
    category: "Grocery",
    supplier: "Golden Rice Co",
    stock: 44,
    unit: "bag",
    price: 1.1,
    cost: 0.88,
    status: "In Stock",
  },
  {
    sku: "SKU-0012",
    name: "Dish Soap 500ml",
    category: "Household",
    supplier: "CleanPro",
    stock: 27,
    unit: "bottle",
    price: 1.75,
    cost: 1.05,
    status: "In Stock",
  },
  {
    sku: "SKU-0013",
    name: "Sprite 330ml",
    category: "Beverages",
    supplier: "Cambrew Ltd",
    stock: 190,
    unit: "can",
    price: 0.75,
    cost: 0.54,
    status: "In Stock",
  },
  {
    sku: "SKU-0014",
    name: "Iced Coffee 250ml",
    category: "Beverages",
    supplier: "Highland Roasters",
    stock: 64,
    unit: "bottle",
    price: 1.2,
    cost: 0.79,
    status: "In Stock",
  },
  {
    sku: "SKU-0015",
    name: "Green Tea 500ml",
    category: "Beverages",
    supplier: "Highland Roasters",
    stock: 15,
    unit: "bottle",
    price: 0.85,
    cost: 0.55,
    status: "Low Stock",
  },
  {
    sku: "SKU-0016",
    name: "Orange Juice 1L",
    category: "Beverages",
    supplier: "Fresh Valley",
    stock: 0,
    unit: "carton",
    price: 2.4,
    cost: 1.72,
    status: "Out of Stock",
  },
  {
    sku: "SKU-0017",
    name: "Energy Drink 250ml",
    category: "Beverages",
    supplier: "Cambrew Ltd",
    stock: 108,
    unit: "can",
    price: 1.1,
    cost: 0.72,
    status: "In Stock",
  },
  {
    sku: "SKU-0018",
    name: "Soy Sauce 500ml",
    category: "Grocery",
    supplier: "Sea Taste",
    stock: 52,
    unit: "bottle",
    price: 1.3,
    cost: 0.88,
    status: "In Stock",
  },
  {
    sku: "SKU-0019",
    name: "Palm Sugar 500g",
    category: "Grocery",
    supplier: "Golden Rice Co",
    stock: 8,
    unit: "pack",
    price: 1.6,
    cost: 1.15,
    status: "Low Stock",
  },
  {
    sku: "SKU-0020",
    name: "Rice Noodles 400g",
    category: "Grocery",
    supplier: "Mama Foods",
    stock: 140,
    unit: "pack",
    price: 0.95,
    cost: 0.61,
    status: "In Stock",
  },
  {
    sku: "SKU-0021",
    name: "Canned Sardines",
    category: "Grocery",
    supplier: "Sea Taste",
    stock: 96,
    unit: "can",
    price: 1.05,
    cost: 0.68,
    status: "In Stock",
  },
  {
    sku: "SKU-0022",
    name: "Sticky Rice 2kg",
    category: "Grocery",
    supplier: "Golden Rice Co",
    stock: 38,
    unit: "bag",
    price: 4.2,
    cost: 3.35,
    status: "In Stock",
  },
  {
    sku: "SKU-0023",
    name: "Salt 500g",
    category: "Grocery",
    supplier: "Sea Taste",
    stock: 210,
    unit: "pack",
    price: 0.4,
    cost: 0.22,
    status: "In Stock",
  },
  {
    sku: "SKU-0024",
    name: "Black Pepper 100g",
    category: "Grocery",
    supplier: "Kampot Spice",
    stock: 19,
    unit: "jar",
    price: 2.8,
    cost: 1.95,
    status: "Low Stock",
  },
  {
    sku: "SKU-0025",
    name: "Chili Paste 200g",
    category: "Grocery",
    supplier: "Kampot Spice",
    stock: 0,
    unit: "jar",
    price: 1.85,
    cost: 1.24,
    status: "Out of Stock",
  },
  {
    sku: "SKU-0026",
    name: "Shampoo 400ml",
    category: "Personal Care",
    supplier: "Colgate KH",
    stock: 46,
    unit: "bottle",
    price: 3.5,
    cost: 2.3,
    status: "In Stock",
  },
  {
    sku: "SKU-0027",
    name: "Toothbrush",
    category: "Personal Care",
    supplier: "Colgate KH",
    stock: 130,
    unit: "piece",
    price: 0.9,
    cost: 0.41,
    status: "In Stock",
  },
  {
    sku: "SKU-0028",
    name: "Face Towel",
    category: "Personal Care",
    supplier: "CleanPro",
    stock: 11,
    unit: "piece",
    price: 1.5,
    cost: 0.82,
    status: "Low Stock",
  },
  {
    sku: "SKU-0029",
    name: "Hand Sanitizer 250ml",
    category: "Personal Care",
    supplier: "CleanPro",
    stock: 73,
    unit: "bottle",
    price: 1.95,
    cost: 1.18,
    status: "In Stock",
  },
  {
    sku: "SKU-0030",
    name: "Razor Blades 5pk",
    category: "Personal Care",
    supplier: "Colgate KH",
    stock: 0,
    unit: "pack",
    price: 2.65,
    cost: 1.7,
    status: "Out of Stock",
  },
  {
    sku: "SKU-0031",
    name: "Peanuts 100g",
    category: "Snacks",
    supplier: "Mama Foods",
    stock: 165,
    unit: "pack",
    price: 0.65,
    cost: 0.38,
    status: "In Stock",
  },
  {
    sku: "SKU-0032",
    name: "Dried Mango 80g",
    category: "Snacks",
    supplier: "Fresh Valley",
    stock: 42,
    unit: "pack",
    price: 1.4,
    cost: 0.86,
    status: "In Stock",
  },
  {
    sku: "SKU-0033",
    name: "Chocolate Bar 45g",
    category: "Snacks",
    supplier: "Sweet Hut",
    stock: 9,
    unit: "bar",
    price: 1.15,
    cost: 0.7,
    status: "Low Stock",
  },
  {
    sku: "SKU-0034",
    name: "Biscuits 200g",
    category: "Snacks",
    supplier: "Sweet Hut",
    stock: 118,
    unit: "pack",
    price: 1.25,
    cost: 0.74,
    status: "In Stock",
  },
  {
    sku: "SKU-0035",
    name: "Shrimp Crackers 70g",
    category: "Snacks",
    supplier: "Mama Foods",
    stock: 88,
    unit: "pack",
    price: 0.7,
    cost: 0.41,
    status: "In Stock",
  },
  {
    sku: "SKU-0036",
    name: "Laundry Powder 1kg",
    category: "Household",
    supplier: "CleanPro",
    stock: 34,
    unit: "bag",
    price: 2.9,
    cost: 1.98,
    status: "In Stock",
  },
  {
    sku: "SKU-0037",
    name: "Floor Cleaner 900ml",
    category: "Household",
    supplier: "CleanPro",
    stock: 16,
    unit: "bottle",
    price: 2.25,
    cost: 1.42,
    status: "Low Stock",
  },
  {
    sku: "SKU-0038",
    name: "Trash Bags 30pk",
    category: "Household",
    supplier: "CleanPro",
    stock: 57,
    unit: "roll",
    price: 1.8,
    cost: 1.06,
    status: "In Stock",
  },
  {
    sku: "SKU-0039",
    name: "Charcoal 2kg",
    category: "Household",
    supplier: "Mekong Supply",
    stock: 0,
    unit: "bag",
    price: 2.5,
    cost: 1.6,
    status: "Out of Stock",
  },
  {
    sku: "SKU-0040",
    name: "AA Batteries 4pk",
    category: "Household",
    supplier: "Mekong Supply",
    stock: 62,
    unit: "pack",
    price: 2.2,
    cost: 1.35,
    status: "In Stock",
  },
  {
    sku: "SKU-0041",
    name: "Light Bulb 9W",
    category: "Household",
    supplier: "Mekong Supply",
    stock: 14,
    unit: "piece",
    price: 1.7,
    cost: 0.98,
    status: "Low Stock",
  },
  {
    sku: "SKU-0042",
    name: "Matches 10pk",
    category: "Household",
    supplier: "Mekong Supply",
    stock: 240,
    unit: "pack",
    price: 0.3,
    cost: 0.15,
    status: "In Stock",
  },
]

export const sampleCustomers: Customer[] = [
  {
    id: "C-1001",
    name: "Sophea Chan",
    phone: "012 345 678",
    city: "Phnom Penh",
    status: "Active",
    balance: 125.5,
  },
  {
    id: "C-1002",
    name: "Dara Kim",
    phone: "011 222 333",
    city: "Siem Reap",
    status: "Active",
    balance: 0,
  },
  {
    id: "C-1003",
    name: "Bopha Ny",
    phone: "017 888 999",
    city: "Battambang",
    status: "Inactive",
    balance: 42.0,
  },
  {
    id: "C-1004",
    name: "Vichea Sok",
    phone: "010 555 111",
    city: "Phnom Penh",
    status: "Active",
    balance: 310.75,
  },
  {
    id: "C-1005",
    name: "Chan Thida",
    phone: "015 777 444",
    city: "Kampot",
    status: "Active",
    balance: 88.25,
  },
  {
    id: "C-1006",
    name: "Rithy Meas",
    phone: "016 909 202",
    city: "Siem Reap",
    status: "Inactive",
    balance: 0,
  },
  {
    id: "C-1007",
    name: "Sokha Pen",
    phone: "092 121 343",
    city: "Phnom Penh",
    status: "Active",
    balance: 199.99,
  },
  {
    id: "C-1008",
    name: "Maly Chea",
    phone: "093 454 656",
    city: "Battambang",
    status: "Active",
    balance: 15.0,
  },
]

/** How a ticket was paid. Cash still leads; ABA/Wing are the local wallets. */
export type PaymentMethod = "Cash" | "ABA" | "Wing" | "Card"

/** One line of a ticket: how many of a SKU were rung up. */
export type SaleLine = { sku: string; qty: number }

/**
 * A single ticket. Deliberately stores no total — the total is `saleTotal()`
 * over the lines, so a ticket can never disagree with the items on it.
 */
export type Sale = {
  id: string
  /** Hour of the 24h clock the ticket was rung up in (store trades 7–21). */
  hour: number
  /** Wall-clock label for the recent-tickets feed, e.g. "18:42". */
  time: string
  /** Set when the sale was rung up against a customer account. */
  customerId?: string
  method: PaymentMethod
  lines: SaleLine[]
}

/** The store's trading hours, inclusive — a 7am open and a 9pm close. */
export const TRADING_HOURS = Array.from({ length: 15 }, (_, i) => 7 + i)

/**
 * Relative footfall per trading hour: a breakfast rush, a lunch bump, and the
 * big after-work peak. This curve is the shape of the day — ticket counts are
 * drawn from it, so the hourly chart and the KPIs come from the same source.
 */
const HOUR_WEIGHTS: Record<number, number> = {
  7: 5,
  8: 7,
  9: 5,
  10: 4,
  11: 7,
  12: 9,
  13: 6,
  14: 4,
  15: 4,
  16: 6,
  17: 11,
  18: 14,
  19: 12,
  20: 7,
  21: 3,
}

/** How often each payment method turns up, as relative weights. */
const METHOD_WEIGHTS: [PaymentMethod, number][] = [
  ["Cash", 52],
  ["ABA", 28],
  ["Wing", 12],
  ["Card", 8],
]

/** Relative likelihood of a SKU landing in a basket — staples move fastest. */
const SKU_WEIGHTS: Record<string, number> = {
  "SKU-0001": 14, // Coca-Cola
  "SKU-0002": 11, // Angkor Beer
  "SKU-0003": 4, // Jasmine Rice (big ticket, slow mover)
  "SKU-0004": 3, // Fish Sauce
  "SKU-0005": 16, // Instant Noodles
  "SKU-0006": 5, // Cooking Oil
  "SKU-0007": 4, // Toothpaste
  "SKU-0008": 6, // Bath Soap
  "SKU-0009": 9, // Potato Chips
  "SKU-0010": 13, // Mineral Water
  "SKU-0011": 6, // Sugar
  "SKU-0012": 3, // Dish Soap
}

/**
 * A tiny seeded PRNG (mulberry32). Fixtures must be identical on every render
 * and in every test run, so the day is generated from a fixed seed rather than
 * `Math.random()` — same seed in, same day out.
 */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Draw one entry from `[value, weight]` pairs, proportional to weight. */
function weightedPick<T>(pairs: [T, number][], rand: () => number): T {
  const total = pairs.reduce((sum, [, w]) => sum + w, 0)
  let roll = rand() * total
  for (const [value, weight] of pairs) {
    roll -= weight
    if (roll <= 0) return value
  }
  return pairs[pairs.length - 1][0]
}

/**
 * Generate one trading day of tickets from a seed. Sellable SKUs only — an
 * out-of-stock item can't be rung up, which is what makes the inventory panel
 * and the sales figures tell a consistent story.
 */
function generateDay(seed: number, volume: number): Sale[] {
  const rand = mulberry32(seed)
  const sellable = sampleInventory.filter(
    (item) => item.status !== "Out of Stock"
  )
  const skuPairs: [string, number][] = sellable.map((item) => [
    item.sku,
    SKU_WEIGHTS[item.sku] ?? 1,
  ])
  const sales: Sale[] = []

  for (const hour of TRADING_HOURS) {
    const weight = HOUR_WEIGHTS[hour] ?? 1
    // Jitter the hour's ticket count a little so the curve isn't mechanical.
    const count = Math.max(
      1,
      Math.round(weight * volume * (0.85 + rand() * 0.3))
    )
    for (let i = 0; i < count; i++) {
      const lineCount = 1 + Math.floor(rand() * 3.4)
      const lines: SaleLine[] = []
      for (let j = 0; j < lineCount; j++) {
        const sku = weightedPick(skuPairs, rand)
        if (lines.some((line) => line.sku === sku)) continue
        lines.push({ sku, qty: 1 + Math.floor(rand() * 2.6) })
      }
      const minute = Math.floor(rand() * 60)
      sales.push({
        id: `T-${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}-${i}`,
        hour,
        time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        method: weightedPick(METHOD_WEIGHTS, rand),
        // Roughly one ticket in six is rung up against an account.
        customerId:
          rand() < 0.16
            ? sampleCustomers[Math.floor(rand() * sampleCustomers.length)].id
            : undefined,
        lines,
      })
    }
  }
  return sales
}

/**
 * Today's and yesterday's tickets. Two seeds, and today runs a little hotter —
 * that gap is what the KPI deltas measure. Everything the dashboard shows is
 * derived from these two arrays plus {@link sampleInventory}, so no total on
 * screen can drift from the tickets underneath it.
 */
export const todaySales: Sale[] = generateDay(20260716, 2.6)
export const yesterdaySales: Sale[] = generateDay(20260715, 2.35)

/**
 * The trading day the fixtures describe. A fixed label rather than a live
 * clock: the dashboard is statically exported, so a `new Date()` here would
 * render one date on the server and another in the browser.
 */
export const businessDate = "Thu 16 Jul"

/** The signed-in user shown in the sidebar footer and the top-level identity card. */
export const sidebarUser = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.png",
  // The identity card above the menu search: session and company context.
  lastSignedOn: "01 JAN 2025 at 06:29",
  loginAttempts: 0,
  company: "Model Bank",
  companyCode: "GB0010001",
  businessDate: "20-MAY-2024",
}

export type Notification = {
  id: string
  title: string
  body: string
  /** A static relative-time label — see `businessDate` for why it isn't live. */
  time: string
  unread: boolean
}

/**
 * Mock notifications behind the header bell. The count of `unread` entries is
 * what the bell's badge reflects.
 */
export const sampleNotifications: Notification[] = [
  {
    id: "n1",
    title: "Low stock alert",
    body: "Angkor Beer 330ml is down to 18 cans.",
    time: "5m ago",
    unread: true,
  },
  {
    id: "n2",
    title: "New order",
    body: "Order #1042 was placed for $128.50.",
    time: "1h ago",
    unread: true,
  },
  {
    id: "n3",
    title: "Payment received",
    body: "Sok Dara settled an outstanding balance of $42.00.",
    time: "3h ago",
    unread: true,
  },
  {
    id: "n4",
    title: "Daily summary ready",
    body: "Yesterday's sales report is available to review.",
    time: "Yesterday",
    unread: false,
  },
]

/** The workspace named in the sidebar header. */
export const sidebarWorkspace = {
  name: "Acme Inc",
  // Fills whatever box the header gives it, which differs between the rail
  // and the open sidebar. `!` because the sidebar and menu button variants
  // both dictate a size for any descendant svg.
  logo: <BrandMark className="size-full!" />,
  plan: "Enterprise",
}
