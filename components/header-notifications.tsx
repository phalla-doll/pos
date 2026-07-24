"use client"

import { Bell } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { sampleNotifications } from "@/lib/fixtures"
import { cn } from "@/lib/utils"

const UNREAD_COUNT = sampleNotifications.filter((n) => n.unread).length

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
          />
        }
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
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <PopoverHeader className="flex-row items-center justify-between border-b px-3 py-2.5">
          <PopoverTitle>Notifications</PopoverTitle>
          {UNREAD_COUNT > 0 && (
            <span className="text-xs text-muted-foreground">
              {UNREAD_COUNT} unread
            </span>
          )}
        </PopoverHeader>
        <ul className="flex max-h-96 flex-col overflow-y-auto py-1">
          {sampleNotifications.map((n) => (
            <li
              key={n.id}
              className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent"
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  n.unread ? "bg-destructive" : "bg-transparent"
                )}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-medium">{n.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {n.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{n.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
