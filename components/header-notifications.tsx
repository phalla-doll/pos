"use client"

import { Bell, BellOff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// A placeholder unread count, here to show how the badge sits on the bell.
const UNREAD_COUNT = 3

export function HeaderNotifications() {
  return (
    <Popover>
      <PopoverTrigger
        render={
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
        }
      />
      <PopoverContent align="end" className="w-80">
        <Empty className="p-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellOff />
            </EmptyMedia>
            <EmptyTitle>No notifications</EmptyTitle>
            <EmptyDescription>You&apos;re all caught up.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </PopoverContent>
    </Popover>
  )
}
