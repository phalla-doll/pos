"use client"

import * as React from "react"

import { NavMain, NavMainLive } from "@/components/nav-main"
import { NavPanel, NavSearchResults } from "@/components/nav-panel"
import { NavProfilePanel } from "@/components/nav-profile-panel"
import { NavUser } from "@/components/nav-user"
import { NavUserCard } from "@/components/nav-user-card"
import { SidebarBrand } from "@/components/sidebar-brand"
import { useSidebarPanel } from "@/components/sidebar-shell"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebarLaunchState } from "@/hooks/use-tabs"
import { cn } from "@/lib/utils"
import { railButton } from "@/lib/sidebar-metrics"
import { filterNavCommands, flattenNav, sidebarNav } from "@/lib/nav"
import { groupAtPath } from "@/lib/nav-section"
import type { ScreenType } from "@/lib/screens"
import { freshWorkspaceHref } from "@/lib/tab-url"
import { sidebarUser, sidebarWorkspace } from "@/lib/fixtures"
import {
  ChevronLeftIcon,
  Grid2x2Plus,
  PinIcon,
  SearchIcon,
} from "lucide-react"

/**
 * The sidebar, in two shapes for two form factors:
 *
 * - **Desktop** is the two-pane "nested sidebars" layout — a fixed icon rail
 *   (pane 1) beside a detail panel (pane 2) that shows one section at a time.
 * - **Mobile** is the classic single column: the full nav tree in an off-canvas
 *   sheet, where there is room for labels and no room for a second pane.
 *
 * Branching here (rather than inside one `Sidebar`) keeps each shape clean. The
 * swap is invisible: on a narrow viewport the desktop sidebar is `hidden` and
 * the mobile sheet starts closed, so nothing flashes when `isMobile` resolves.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar()
  return isMobile ? <MobileSidebar {...props} /> : <DesktopSidebar {...props} />
}

/** Mobile: one column, the whole tree, in a sheet. */
function MobileSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarBrand workspace={sidebarWorkspace} />
      </SidebarHeader>
      <SidebarContent>
        <React.Suspense
          fallback={<NavMain items={sidebarNav} hrefFor={freshWorkspaceHref} />}
        >
          <NavMainLive items={sidebarNav} />
        </React.Suspense>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

/**
 * Desktop: the outer sidebar is `collapsible="icon"`, so collapsing it shrinks
 * the whole thing to the rail's width and `overflow-hidden` clips pane 2 away —
 * that *is* how pane 2 opens and closes. `*:data-[sidebar=sidebar]:flex-row`
 * lays the two nested sidebars side by side.
 *
 * The body reads the URL (launcher hrefs, focused section), so it lives inside
 * `<Suspense>` with a fresh-workspace fallback — the same prerender-safe pattern
 * the single-column sidebar used.
 */
function DesktopSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      // The full-width app bar owns the top strip, so the fixed sidebar starts
      // below it: override the vendor's `inset-y-0`/`h-svh` to begin at
      // `--header-height` and run the remaining viewport height.
      className="top-(--header-height) h-[calc(100svh-var(--header-height))] overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      <React.Suspense
        fallback={
          <SidebarBody hrefFor={freshWorkspaceHref} focusedType={null} />
        }
      >
        <SidebarBodyLive />
      </React.Suspense>
    </Sidebar>
  )
}

/** The desktop body wired to the live URL. */
function SidebarBodyLive() {
  const { hrefFor, focusedType } = useSidebarLaunchState()
  return <SidebarBody hrefFor={hrefFor} focusedType={focusedType} />
}

/**
 * The two panes and the state that ties them together: pane 2's **navigation
 * path**.
 *
 * Pane 2's open/closed is the `open` flag from `sidebar-shell.tsx` — `pinned`
 * (persisted) or `transientOpen` (this session only). This holds where inside it
 * you are. The path is a stack of group labels drilled into from the root: an
 * empty path is the **Menu** — the whole top-level tree — and each entry drills
 * one group deeper. So pane 2 never expands inline: clicking a group *replaces*
 * the level with its children, and Back pops one off.
 *
 * `dir` records whether the last move was deeper or back, purely so the level
 * can slide in from the matching side.
 *
 * The three ways the panel opens and closes:
 *
 * - **Menu** (rail) opens it *transiently* when shut, jumps to the root when
 *   drilled in, and closes it when already at the root.
 * - **Pin** (header) flips the standing intent. Unpinning keeps the panel up
 *   transiently so it doesn't vanish under the cursor — the next screen closes it.
 * - **Selecting a screen** drops the transient flag, so an unpinned panel gets
 *   out of the way once it has done its job; a pinned one stays.
 */
function SidebarBody({
  hrefFor,
  focusedType,
}: {
  hrefFor: (ref: { screenType: ScreenType }) => string
  focusedType: ScreenType | null
}) {
  const { pinned, open, setPinned, setTransientOpen } = useSidebarPanel()
  const [nav, setNav] = React.useState<{
    path: string[]
    dir: "forward" | "back"
    // `menu` is the group tree; `profile` is the identity view drilled into from
    // the identity row. A sibling of the path stack rather than a member of it —
    // the profile isn't a nav group, so it doesn't belong in `path`.
    view: "menu" | "profile"
  }>({ path: [], dir: "forward", view: "menu" })
  // The menu filter. Cleared on every move so a query never lingers over a
  // level it wasn't typed against.
  const [query, setQuery] = React.useState("")

  const { path, dir, view } = nav
  const inProfile = view === "profile"
  // What fills the panel: the top-level tree at the root, else the group's
  // children — falling back to the root so a stale path can't empty the panel.
  const group = groupAtPath(sidebarNav, path)
  const items = path.length === 0 ? sidebarNav : (group?.children ?? sidebarNav)
  const title = inProfile
    ? "Profile"
    : path.length === 0
      ? "Menu"
      : (group?.label ?? "Menu")
  const canGoBack = inProfile || path.length > 0

  // Search is scoped to the level in view: flatten this subtree's leaves and
  // keep the ones that match. Empty at the root means "all screens"; drilled in
  // it means "this section only".
  const searching = query.trim().length > 0
  const results = searching ? filterNavCommands(flattenNav(items), query) : []

  // The rail's Menu button: open (transiently) to the top-level menu, jump back
  // to it from a drilled level, or close it when it's already showing the top
  // level. Opening here never pins — that is the pin button's job alone.
  const toggleMenu = React.useCallback(() => {
    setQuery("")
    if (!open) {
      setNav({ path: [], dir: "back", view: "menu" })
      setTransientOpen(true)
    } else if (path.length > 0 || inProfile) {
      setNav({ path: [], dir: "back", view: "menu" })
    } else {
      setPinned(false)
      setTransientOpen(false)
    }
  }, [open, path.length, inProfile, setPinned, setTransientOpen])

  // Drill one level deeper: the clicked group's children take over the panel.
  const drill = React.useCallback((label: string) => {
    setQuery("")
    setNav((n) => ({ path: [...n.path, label], dir: "forward", view: "menu" }))
  }, [])

  // Drill into the profile view from the identity row.
  const openProfile = React.useCallback(() => {
    setQuery("")
    setNav({ path: [], dir: "forward", view: "profile" })
  }, [])

  // Back up one level: out of the profile to the menu root, else pop one group
  // off the path; from the top of the menu there is nowhere further up.
  const back = React.useCallback(() => {
    setQuery("")
    setNav((n) =>
      n.view === "profile"
        ? { path: [], dir: "back", view: "menu" }
        : n.path.length > 0
          ? { path: n.path.slice(0, -1), dir: "back", view: "menu" }
          : n
    )
  }, [])

  // The header's pin button: flip the standing intent. Unpinning keeps the
  // panel up transiently — it shouldn't slam shut with the button under the
  // cursor — and the next screen selection clears that.
  const togglePin = React.useCallback(() => {
    if (pinned) {
      setPinned(false)
      setTransientOpen(true)
    } else {
      setPinned(true)
      setTransientOpen(false)
    }
  }, [pinned, setPinned, setTransientOpen])

  // Selecting a screen retires an unpinned (transient) panel; a pinned one
  // stays. Threaded to every launcher link in the panel.
  const closeOnNavigate = React.useCallback(() => {
    if (!pinned) setTransientOpen(false)
  }, [pinned, setTransientOpen])

  return (
    <>
      {/* Pane 1 — the icon rail. Pinned to the rail width; the outer sidebar's
          collapse shrinks the whole container to exactly this. The brand now
          lives in the full-width app bar, so the rail leads with its buttons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! shrink-0 border-r"
      >
        <SidebarContent className="pt-2">
          <SidebarGroup className="px-1.5">
            <SidebarGroupContent>
              {/* The rail's own buttons. For now just Menu — the whole nav tree
                  lives in the panel it opens; future entries (Favorites, …) sit
                  alongside it here. */}
              <SidebarMenu className="gap-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={{ children: "Menu", hidden: false }}
                    aria-label="Menu"
                    isActive={open}
                    className={railButton}
                    onClick={toggleMenu}
                  >
                    <Grid2x2Plus />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={sidebarUser} />
        </SidebarFooter>
      </Sidebar>

      {/* Pane 2 — the current level. `flex-1` fills the rest when the sidebar is
          expanded, and is clipped by the outer `overflow-hidden` when collapsed;
          no `hidden` of its own, so the collapse reads as one panel sliding
          away rather than two things toggling. */}
      <Sidebar collapsible="none" className="flex min-w-0 flex-1">
        <SidebarHeader className="h-16 flex-row items-center gap-2 border-b px-4">
          {canGoBack && <BackButton onClick={back} />}
          <div className="flex-1 truncate text-sm font-medium text-foreground">
            {title}
          </div>
          <PinButton pinned={pinned} onClick={togglePin} />
        </SidebarHeader>
        <SidebarContent className="overflow-x-hidden">
          {inProfile ? (
            // The profile view takes over the whole panel — no search or list.
            <div
              key="profile"
              className="animate-in duration-200 fade-in-0 slide-in-from-right-4"
            >
              <NavProfilePanel user={sidebarUser} />
            </div>
          ) : (
            <>
              {/* Search sits at the very top and filters the level in view. */}
              <div className="px-3 pt-3 pb-3">
                <InputGroup className="rounded-full px-1">
                  <InputGroupAddon>
                    <SearchIcon strokeWidth={1.5} />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Search menu..."
                    aria-label="Search menu"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </InputGroup>
              </div>
              {/* The identity row follows the search at the top level only —
                  once drilled into a section the list takes the space. A divider
                  sets it apart from the list below, and clicking it drills into
                  the profile view. */}
              {path.length === 0 && (
                <div className="border-b px-3 pb-4">
                  <NavUserCard user={sidebarUser} onClick={openProfile} />
                </div>
              )}
              {searching ? (
                <NavSearchResults
                  commands={results}
                  hrefFor={hrefFor}
                  focusedType={focusedType}
                  onNavigate={closeOnNavigate}
                />
              ) : (
                // Keyed on the path so each level is its own mount and slides in
                // from the side the move came from — deeper from the right, back
                // from the left.
                <div
                  key={path.join("/")}
                  className={cn(
                    "animate-in duration-200 fade-in-0",
                    dir === "forward"
                      ? "slide-in-from-right-4"
                      : "slide-in-from-left-4"
                  )}
                >
                  <NavPanel
                    items={items}
                    hrefFor={hrefFor}
                    onDrill={drill}
                    focusedType={focusedType}
                    onNavigate={closeOnNavigate}
                  />
                </div>
              )}
            </>
          )}
        </SidebarContent>
      </Sidebar>
    </>
  )
}

/** Backs pane 2 up one level — the mirror of drilling into a group. */
function BackButton({ onClick }: { onClick: () => void }) {
  const label = "Back"
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            className="-ml-1 size-7"
            onClick={onClick}
          >
            <ChevronLeftIcon strokeWidth={1.5} />
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Toggles the pin — pane 2's standing intent to stay open. Filled and tinted
 * when pinned; an outline "pin me" affordance when not. Unpinning doesn't close
 * the panel outright (see `togglePin`), so this reads as a sticky toggle, not a
 * close button.
 */
function PinButton({
  pinned,
  onClick,
}: {
  pinned: boolean
  onClick: () => void
}) {
  const label = pinned ? "Unpin sidebar" : "Pin sidebar"
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            aria-pressed={pinned}
            className={cn("size-7", pinned && "text-primary")}
            onClick={onClick}
          >
            <PinIcon
              strokeWidth={1.5}
              className={cn(pinned && "fill-current")}
            />
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
