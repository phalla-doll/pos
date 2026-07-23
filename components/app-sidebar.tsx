"use client"

import * as React from "react"

import { NavMain, NavMainLive } from "@/components/nav-main"
import { NavPanel, NavSearchResults } from "@/components/nav-panel"
import { NavUser } from "@/components/nav-user"
import { SidebarBrand } from "@/components/sidebar-brand"
import { useSidebarPin } from "@/components/sidebar-shell"
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
  MenuIcon,
  PanelLeftIcon,
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
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
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
 * The pin *is* pane 2's open/closed (see `sidebar-shell.tsx`); this holds where
 * inside it you are. The path is a stack of group labels drilled into from the
 * root: an empty path is the **Menu** — the whole top-level tree — and each
 * entry drills one group deeper. So pane 2 never expands inline: clicking a
 * group *replaces* the level with its children, and Back pops one off.
 *
 * `dir` records whether the last move was deeper or back, purely so the level
 * can slide in from the matching side.
 */
function SidebarBody({
  hrefFor,
  focusedType,
}: {
  hrefFor: (ref: { screenType: ScreenType }) => string
  focusedType: ScreenType | null
}) {
  const { pinned, setPinned } = useSidebarPin()
  const [nav, setNav] = React.useState<{
    path: string[]
    dir: "forward" | "back"
  }>({ path: [], dir: "forward" })
  // The menu filter. Cleared on every move so a query never lingers over a
  // level it wasn't typed against.
  const [query, setQuery] = React.useState("")

  const { path, dir } = nav
  // What fills the panel: the top-level tree at the root, else the group's
  // children — falling back to the root so a stale path can't empty the panel.
  const group = groupAtPath(sidebarNav, path)
  const items = path.length === 0 ? sidebarNav : (group?.children ?? sidebarNav)
  const title = path.length === 0 ? "Menu" : (group?.label ?? "Menu")
  const canGoBack = path.length > 0

  // Search is scoped to the level in view: flatten this subtree's leaves and
  // keep the ones that match. Empty at the root means "all screens"; drilled in
  // it means "this section only".
  const searching = query.trim().length > 0
  const results = searching ? filterNavCommands(flattenNav(items), query) : []

  // The rail's Menu button: open to the top-level menu, jump back to it from a
  // drilled level, or close it when it's already showing the top level.
  const toggleMenu = React.useCallback(() => {
    setQuery("")
    if (!pinned) {
      setNav({ path: [], dir: "back" })
      setPinned(true)
    } else if (path.length > 0) {
      setNav({ path: [], dir: "back" })
    } else {
      setPinned(false)
    }
  }, [pinned, path.length, setPinned])

  // Drill one level deeper: the clicked group's children take over the panel.
  const drill = React.useCallback((label: string) => {
    setQuery("")
    setNav((n) => ({ path: [...n.path, label], dir: "forward" }))
  }, [])

  // Back up one level; from the top level there is nowhere further up.
  const back = React.useCallback(() => {
    setQuery("")
    setNav((n) =>
      n.path.length > 0 ? { path: n.path.slice(0, -1), dir: "back" } : n
    )
  }, [])

  // Closes the panel down to the bare rail.
  const collapse = React.useCallback(() => setPinned(false), [setPinned])

  return (
    <>
      {/* Pane 1 — the icon rail. Pinned to the rail width; the outer sidebar's
          collapse shrinks the whole container to exactly this. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! shrink-0 border-r"
      >
        <SidebarHeader>
          <SidebarBrand workspace={sidebarWorkspace} />
        </SidebarHeader>
        <SidebarContent>
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
                    isActive={pinned}
                    className={railButton}
                    onClick={toggleMenu}
                  >
                    <MenuIcon />
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
          <div className="flex-1 truncate text-base font-medium text-foreground">
            {title}
          </div>
          <CollapsePanelButton onClick={collapse} />
        </SidebarHeader>
        <SidebarContent className="overflow-x-hidden">
          {/* Search sits above the list and filters the level in view. */}
          <div className="p-2 pb-1">
            <InputGroup>
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
          {searching ? (
            <NavSearchResults
              commands={results}
              hrefFor={hrefFor}
              focusedType={focusedType}
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
              />
            </div>
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

/** Closes pane 2 down to the rail — the mirror of selecting its rail icon. */
function CollapsePanelButton({ onClick }: { onClick: () => void }) {
  const label = "Collapse panel"
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            className="size-7"
            onClick={onClick}
          >
            <PanelLeftIcon strokeWidth={1.5} />
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
