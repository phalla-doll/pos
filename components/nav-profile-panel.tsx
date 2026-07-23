"use client"

import { KeyRound, Pencil } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { userInitials } from "@/lib/user-initials"

/**
 * The profile view of pane 2 — the level you drill into from the identity row
 * (see the `profile` view in `components/app-sidebar.tsx`). It gives the whole
 * panel over to the signed-in user: a large avatar with an edit-picture
 * affordance, their session/company info, and account actions.
 *
 * Presentational like `NavUserCard`: initials fall back from `name`, everything
 * else is read straight from the fixture. The action buttons are affordances
 * only — there is no backend to reset a password against.
 */
export function NavProfilePanel({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    lastSignedOn: string
    loginAttempts: number
    company: string
    companyCode: string
    businessDate: string
  }
}) {
  return (
    <div className="flex flex-col gap-6 px-4 py-4 text-sm">
      {/* Identity + edit-picture affordance. */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative">
          <Avatar className="size-20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary text-lg font-medium text-primary-foreground">
              {userInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Edit profile picture"
            className="absolute -right-1 -bottom-1 size-7 rounded-full border shadow-sm"
          >
            <Pencil strokeWidth={1.5} />
          </Button>
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground">
            {user.name}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {user.email}
          </div>
        </div>
      </div>

      {/* Session and company info, read straight from the fixture. */}
      <dl className="grid gap-3 rounded-lg border p-3">
        <InfoRow
          label="Company"
          value={`${user.company} (${user.companyCode})`}
        />
        <InfoRow label="Business date" value={user.businessDate} />
        <InfoRow label="Last signed on" value={user.lastSignedOn} />
        <InfoRow label="Login attempts" value={String(user.loginAttempts)} />
      </dl>

      {/* Account actions. */}
      <div className="flex flex-col gap-2">
        <Button variant="outline" className="justify-start gap-2">
          <KeyRound strokeWidth={1.5} />
          Reset password
        </Button>
      </div>
    </div>
  )
}

/**
 * One label/value pair in the info block. Stacked — label over value — so a
 * long value (a company name, a full timestamp) takes the panel's full width
 * and wraps instead of being clipped by the narrow pane.
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words text-foreground">{value}</dd>
    </div>
  )
}
