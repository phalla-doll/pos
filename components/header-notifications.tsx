"use client"

import { Bell } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// A placeholder unread count, here to show how the badge sits on the bell.
const UNREAD_COUNT = 3

export function HeaderNotifications() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={`Notifications, ${UNREAD_COUNT} unread`}
    >
      <Bell />
      {UNREAD_COUNT > 0 && (
        <Badge
          aria-hidden
          className="pointer-events-none absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full border-transparent bg-destructive px-1 text-[10px] text-white tabular-nums"
        >
          {UNREAD_COUNT > 99 ? "99+" : UNREAD_COUNT}
        </Badge>
      )}
    </Button>
  )
}
