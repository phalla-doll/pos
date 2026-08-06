"use client"

import { CircleQuestionMark } from "lucide-react"

import { MetaKey } from "@/components/header-search"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MOD, shortcuts } from "@/lib/shortcuts"

/**
 * The keyboard shortcuts the app answers to, behind a `?` in the app bar.
 *
 * A popover rather than a dialog, and shaped like the notifications one beside
 * it: both are a short list you glance at and dismiss, and giving the two
 * neighbouring buttons the same kind of surface is what keeps them reading as
 * one cluster of tools rather than two unrelated controls.
 *
 * The list is `lib/shortcuts.ts`, not a copy of it. That module is also what
 * the handlers ask for their key, so a chord cannot be changed in one place and
 * still advertised here as the old one — the drift that had the workspace's
 * empty state promising a ⌘K nothing was listening for.
 */
export function HeaderHelp() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Keyboard shortcuts" />
        }
      >
        <CircleQuestionMark />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <PopoverHeader className="border-b px-3 py-2.5">
          <PopoverTitle>Keyboard shortcuts</PopoverTitle>
        </PopoverHeader>
        <ul className="flex flex-col py-1">
          {shortcuts.map((shortcut) => (
            <li
              key={shortcut.id}
              className="flex items-start justify-between gap-3 px-3 py-2"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">{shortcut.label}</span>
                {shortcut.note && (
                  <span className="text-xs text-muted-foreground">
                    {shortcut.note}
                  </span>
                )}
              </div>
              {/* One `Kbd` per key rather than one for the whole chord: the
                  keys are pressed separately and `KbdGroup` is what spaces
                  them, the same treatment the empty state gives ⌘K. */}
              <KbdGroup className="shrink-0 pt-0.5">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key === MOD ? <MetaKey /> : key}</Kbd>
                ))}
              </KbdGroup>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
