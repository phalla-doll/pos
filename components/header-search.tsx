"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import {
  commandValue,
  flattenNav,
  sidebarNav,
  type NavCommand,
} from "@/lib/nav"
import type { ScreenType } from "@/lib/screens"
import { launcherHref, contentFromSearch } from "@/lib/tab-url"

/** Heading for palette entries that sit at the top level of the nav tree. */
const UNGROUPED = "Screens"

/**
 * The palette's sections, derived from the nav tree: one per top-level group,
 * plus a leading section for screens that live at the root. Sections appear in
 * first-seen order, so the palette reads in the same order as the sidebar.
 *
 * Computed once at module scope — `sidebarNav` is static, so there is nothing
 * to recompute per render.
 */
const sections: { heading: string; commands: NavCommand[] }[] = (() => {
  const bySection = new Map<string, NavCommand[]>()
  for (const command of flattenNav(sidebarNav)) {
    const heading = command.path[0] ?? UNGROUPED
    const existing = bySection.get(heading)
    if (existing) existing.push(command)
    else bySection.set(heading, [command])
  }
  return [...bySection].map(([heading, commands]) => ({ heading, commands }))
})()

/**
 * Header search: a button that mirrors the look of a search input, plus the
 * ⌘K/Ctrl+K command palette it opens. Searching matches a screen's label and
 * its breadcrumb (see {@link commandValue}), so typing a group name lists the
 * screens inside it.
 *
 * Selecting a screen navigates rather than calling `openTab`: this component
 * renders in the dashboard *layout*, while tab state lives in `useTabs` inside
 * the workspace below it, so there is no shared hook instance to call. The URL
 * is the authoritative handoff — {@link launcherHref} builds the target by
 * running the same reuse-or-create open through the tab reducer, so the
 * palette adds to the open tabs instead of replacing them, exactly as the
 * sidebar does.
 *
 * Unlike the sidebar it renders no href, so it needs the workspace only at
 * click time and reads it straight off the live URL. That keeps this component
 * free of the search-param subscription that would force the whole header out
 * of static rendering.
 */
export function HeaderSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.repeat) return
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return
      e.preventDefault()
      setOpen((prev) => !prev)
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const onSelect = React.useCallback(
    (screenType: ScreenType) => {
      setOpen(false)
      router.push(
        launcherHref(contentFromSearch(window.location.search), screenType)
      )
    },
    [router]
  )

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        // Sized like the search input it replaces: a button only sizes to its
        // own text, so the width is set explicitly, and `shrink` (Button is
        // `shrink-0` by default) lets it give way on a narrow header.
        className="w-80 min-w-0 shrink justify-start pl-2 font-normal text-muted-foreground"
      >
        <Search data-icon="inline-start" />
        Search...
        <Kbd className="ml-auto">
          <MetaKey /> K
        </Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search screens"
        description="Search for a screen and press Enter to open it in a tab."
      >
        {/*
          `CommandDialog` renders only the dialog shell — it does not provide
          the cmdk root, so the `Command` wrapper (which owns the filter state
          the input and items subscribe to) has to be supplied here.
        */}
        <Command>
          <CommandInput placeholder="Search screens..." />
          <CommandList>
            <CommandEmpty>No screens found.</CommandEmpty>
            {sections.map(({ heading, commands }) => (
              <CommandGroup key={heading} heading={heading}>
                {commands.map((command) => {
                  const { screen, path } = command
                  // The section heading already names `path[0]`; show only the
                  // deeper groups, so a 3-level screen still reveals where it
                  // lives without repeating its section.
                  const detail = path.slice(1).join(" › ")
                  return (
                    <CommandItem
                      key={screen.type}
                      value={commandValue(command)}
                      onSelect={() => onSelect(screen.type)}
                    >
                      {screen.icon}
                      <span>{screen.label}</span>
                      {detail && (
                        // The trailing slot: it right-aligns the hint and
                        // suppresses the item's (unused) check icon, which
                        // would otherwise compete for the same space.
                        <CommandShortcut className="tracking-normal">
                          {detail}
                        </CommandShortcut>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

/**
 * The platform's modifier glyph. Read through `useSyncExternalStore` with a
 * never-changing subscription: the value is browser-only and static, and this
 * keeps it out of an effect (which would set state during hydration and
 * trigger a cascading render). The server snapshot renders "⌘"; the client
 * corrects it to "Ctrl" off-Apple during hydration.
 */
function MetaKey() {
  const isMac = React.useSyncExternalStore(
    subscribeNever,
    () => /Mac|iPhone|iPad|iPod/.test(navigator.platform),
    () => true
  )
  return <>{isMac ? "⌘" : "Ctrl"}</>
}

const subscribeNever = () => () => {}
