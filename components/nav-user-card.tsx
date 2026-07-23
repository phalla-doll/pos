"use client"

import { KeyRound, Landmark } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { userInitials } from "@/lib/user-initials"

/**
 * The identity section at the top of pane 2 — an inline card (not a popover)
 * showing who is signed in, their last session, and the active company, with
 * quick "Switch Company" and "Change Password" affordances.
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
    lastSignedOn: string
    loginAttempts: number
    company: string
    companyCode: string
    businessDate: string
  }
}) {
  return (
    <div className="rounded-lg border bg-background p-4 text-sm shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold tracking-wide text-foreground uppercase">
            {user.name}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Last signed on {user.lastSignedOn} with {user.loginAttempts}{" "}
            attempt(s)
          </p>
        </div>
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
            {userInitials(user.name)}
          </AvatarFallback>
        </Avatar>
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
              <span className="ml-auto shrink-0 text-xs font-medium text-muted-foreground">
                {user.businessDate}
              </span>
            </button>
          }
        />
        <TooltipContent>Switch Company</TooltipContent>
      </Tooltip>

      <div className="my-3 border-t" />

      <button
        type="button"
        className="-mx-1 flex w-[calc(100%+0.5rem)] items-center gap-2 rounded-md px-1 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <KeyRound strokeWidth={1.5} className="size-4 shrink-0" />
        Change Password
      </button>
    </div>
  )
}
