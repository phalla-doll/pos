"use client"

import { Bell, BellOff } from "lucide-react"

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

export function HeaderNotifications() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell />
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
