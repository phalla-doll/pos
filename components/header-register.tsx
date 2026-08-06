"use client"

import * as React from "react"
import { Store } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select"
import { defaultRegisterId, posStores } from "@/lib/fixtures"
import { registerLabel } from "@/lib/registers"

/**
 * The store and register the app is trading from, in the app bar.
 *
 * Every screen here is implicitly scoped to one till — the stock counts, the
 * day's takings, the receipts — and nothing on screen said which. This names
 * it, and lets it be changed, which is the piece of context a clerk on a shift
 * needs before any of the numbers mean anything.
 *
 * State is local `useState`, deliberately. It is not workspace content, so it
 * has no business in `?tabs=` — a shared link should restore which screens are
 * open, not reassign the recipient to someone else's counter.
 *
 * The trigger renders its own label rather than a `SelectValue`, because the
 * selected item's text is only half of it: every store has a "Register 1", so
 * the store has to be named alongside it — see {@link registerLabel}, which is
 * where those two halves are joined.
 */
export function HeaderRegister() {
  const [registerId, setRegisterId] = React.useState(defaultRegisterId)
  const label = registerLabel(posStores, registerId)

  return (
    <Select
      value={registerId}
      // Base UI types the new value as nullable for selects that can be
      // cleared. This one always holds a till, so a null is nothing to act on.
      onValueChange={(value) => value !== null && setRegisterId(value)}
    >
      {/* Hidden below `sm`, where the bar has room for the brand and the icon
          buttons and little else. It is context, not a control the clerk
          reaches for often, so it is the first thing to give way. */}
      <SelectTrigger
        aria-label="Store and register"
        className="hidden max-w-64 sm:flex"
      >
        <Store className="text-muted-foreground" />
        <span className="truncate">{label ?? "Select a register"}</span>
      </SelectTrigger>
      <SelectContent align="end">
        {posStores.map((store) => (
          <SelectGroup key={store.name}>
            {/* The store names the group, so each item can stay the bare
                register name rather than repeating its store on every row. */}
            <SelectLabel>{store.name}</SelectLabel>
            {store.registers.map((register) => (
              <SelectItem key={register.id} value={register.id}>
                {register.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
