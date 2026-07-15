/**
 * Sample rows for list screens. These stand in for real data until the
 * screens are wired to a backend — enough variety to exercise filtering.
 */

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
  price: number
  status: "In Stock" | "Low Stock" | "Out of Stock"
}

export const sampleInventory: InventoryItem[] = [
  { sku: "SKU-0001", name: "Coca-Cola 330ml", category: "Beverages", supplier: "Cambrew Ltd", stock: 240, unit: "can", price: 0.75, status: "In Stock" },
  { sku: "SKU-0002", name: "Angkor Beer 330ml", category: "Beverages", supplier: "Cambrew Ltd", stock: 18, unit: "can", price: 0.9, status: "Low Stock" },
  { sku: "SKU-0003", name: "Jasmine Rice 5kg", category: "Grocery", supplier: "Golden Rice Co", stock: 60, unit: "bag", price: 8.5, status: "In Stock" },
  { sku: "SKU-0004", name: "Fish Sauce 500ml", category: "Grocery", supplier: "Sea Taste", stock: 0, unit: "bottle", price: 1.4, status: "Out of Stock" },
  { sku: "SKU-0005", name: "Instant Noodles", category: "Grocery", supplier: "Mama Foods", stock: 320, unit: "pack", price: 0.35, status: "In Stock" },
  { sku: "SKU-0006", name: "Cooking Oil 1L", category: "Grocery", supplier: "Sea Taste", stock: 12, unit: "bottle", price: 2.1, status: "Low Stock" },
  { sku: "SKU-0007", name: "Toothpaste 100g", category: "Personal Care", supplier: "Colgate KH", stock: 85, unit: "tube", price: 1.25, status: "In Stock" },
  { sku: "SKU-0008", name: "Bath Soap", category: "Personal Care", supplier: "Colgate KH", stock: 5, unit: "bar", price: 0.6, status: "Low Stock" },
  { sku: "SKU-0009", name: "Potato Chips 60g", category: "Snacks", supplier: "Mama Foods", stock: 0, unit: "pack", price: 0.8, status: "Out of Stock" },
  { sku: "SKU-0010", name: "Mineral Water 1.5L", category: "Beverages", supplier: "Cambrew Ltd", stock: 150, unit: "bottle", price: 0.5, status: "In Stock" },
  { sku: "SKU-0011", name: "Sugar 1kg", category: "Grocery", supplier: "Golden Rice Co", stock: 44, unit: "bag", price: 1.1, status: "In Stock" },
  { sku: "SKU-0012", name: "Dish Soap 500ml", category: "Household", supplier: "CleanPro", stock: 27, unit: "bottle", price: 1.75, status: "In Stock" },
]

export const sampleCustomers: Customer[] = [
  { id: "C-1001", name: "Sophea Chan", phone: "012 345 678", city: "Phnom Penh", status: "Active", balance: 125.5 },
  { id: "C-1002", name: "Dara Kim", phone: "011 222 333", city: "Siem Reap", status: "Active", balance: 0 },
  { id: "C-1003", name: "Bopha Ny", phone: "017 888 999", city: "Battambang", status: "Inactive", balance: 42.0 },
  { id: "C-1004", name: "Vichea Sok", phone: "010 555 111", city: "Phnom Penh", status: "Active", balance: 310.75 },
  { id: "C-1005", name: "Chan Thida", phone: "015 777 444", city: "Kampot", status: "Active", balance: 88.25 },
  { id: "C-1006", name: "Rithy Meas", phone: "016 909 202", city: "Siem Reap", status: "Inactive", balance: 0 },
  { id: "C-1007", name: "Sokha Pen", phone: "092 121 343", city: "Phnom Penh", status: "Active", balance: 199.99 },
  { id: "C-1008", name: "Maly Chea", phone: "093 454 656", city: "Battambang", status: "Active", balance: 15.0 },
]
