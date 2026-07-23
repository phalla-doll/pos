"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { userInitials } from "@/lib/user-initials"

/**
 * The identity row at the top of pane 2 — an inline block (not a popover)
 * showing who is signed in and their email.
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
  }
}) {
  return (
    <div className="text-sm">
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
    </div>
  )
}
