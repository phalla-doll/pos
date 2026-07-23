"use client"

import { Landmark } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { userInitials } from "@/lib/user-initials"

/**
 * The identity section at the top of pane 2 — an inline card (not a popover)
 * showing who is signed in, their email, and the active company, with
 * a quick "Switch Company" affordance.
 *
 * `components/app-sidebar.tsx` renders it above the menu search and only at the
 * top level: once you drill into a section the card gives way to the list.
 *
 * Presentational: the initials are derived from `name` (see `userInitials`) so
 * the avatar can never disagree with it, and everything else is read straight
 * from the fixture.
 */
export function NavUserCard({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    company: string
    companyCode: string
  }
}) {
  return (
    <div className="rounded-lg border p-4 text-sm">
      <div className="flex items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
            {userInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-semibold tracking-wide text-foreground">
            {user.name}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>

      {/* Company row: a hover reveals it switches the active company. */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Switch company"
              className="-mx-1 mt-3 flex w-[calc(100%+0.5rem)] items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-muted"
            >
              <Landmark
                strokeWidth={1.5}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="truncate">
                {user.company} ({user.companyCode})
              </span>
            </button>
          }
        />
        <TooltipContent>Switch Company</TooltipContent>
      </Tooltip>
    </div>
  )
}
