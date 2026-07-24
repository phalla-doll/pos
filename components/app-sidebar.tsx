"use client"

import * as React from "react"

import { NavMain, NavMainLive } from "@/components/nav-main"
import {
  NavFavoritesPanel,
  NavPanel,
  NavSearchResults,
  type FavoriteControls,
} from "@/components/nav-panel"
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
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useFavorites } from "@/hooks/use-favorites"
import { useSidebarLaunchState } from "@/hooks/use-tabs"
import { cn } from "@/lib/utils"
import { railButton } from "@/lib/sidebar-metrics"
import { favoriteSections } from "@/lib/favorites"
import { filterNavCommands, flattenNav, sidebarNav } from "@/lib/nav"
import { groupAtPath } from "@/lib/nav-section"
import type { ScreenType } from "@/lib/screens"
import { freshWorkspaceHref } from "@/lib/tab-url"
import { sidebarUser, sidebarWorkspace } from "@/lib/fixtures"
import {
  ChevronLeftIcon,
  ClockIcon,
  Grid2x2Plus,
  LayoutGridIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  Star,
  XIcon,
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

/**
 * The rail's buttons, in order — and pane 2's views, which are the same list.
 *
 * Each entry is one button *and* one view of the shared panel: `label` names
 * the button and titles the panel, and `kind` says what fills it. `menu` is the
 * nav tree, `favorites` the flat starred list; the rest render a titled but
 * empty placeholder, with the open/switch/close wiring already in place for
 * when real content arrives.
 *
 * Stating a view once here is what keeps the rail, the panel title, and the
 * active-button rule from drifting — adding a view is one row, not four edits.
 */
const RAIL_VIEWS = [
  { view: "menu", label: "Menu", Icon: Grid2x2Plus, kind: "menu" },
  { view: "favorites", label: "Favorites", Icon: Star, kind: "favorites" },
  { view: "new", label: "New", Icon: PlusIcon, kind: "placeholder" },
  { view: "recent", label: "Recent", Icon: ClockIcon, kind: "placeholder" },
  { view: "apps", label: "Apps", Icon: LayoutGridIcon, kind: "placeholder" },
  {
    view: "settings",
    label: "Settings",
    Icon: SettingsIcon,
    kind: "placeholder",
  },
] as const

/**
 * The enter animation pane 2's levels share: a short fade with a small slide,
 * eased out so the level settles into place rather than stopping dead. Each
 * caller adds the side it slides in from. Declared once so the four levels
 * can't drift apart, and skipped outright when less motion is asked for.
 */
const ENTER =
  "animate-in duration-200 ease-out fade-in-0 motion-reduce:animate-none"

/** A view the rail has a button for. */
type RailView = (typeof RAIL_VIEWS)[number]["view"]

/**
 * What pane 2 is showing. The profile is the one view with no rail button of
 * its own — it is drilled into from the menu's identity row, not opened from
 * the rail — so it sits alongside the table's views rather than in it.
 */
type PanelView = RailView | "profile"

/**
 * The rail button that owns a view, so exactly one reads active at a time. Only
 * the profile needs mapping: you reach it from inside the menu, so the Menu
 * button stays lit while you are in it.
 */
function railViewOf(view: PanelView): RailView {
  return view === "profile" ? "menu" : view
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
  const { favorites, isFavorite, toggle } = useFavorites()
  const [nav, setNav] = React.useState<{
    path: string[]
    dir: "forward" | "back"
    // The view is a sibling of the path stack, not a member of it: only the
    // menu drills, and nothing but a nav group belongs in `path`. See
    // {@link RAIL_VIEWS} for the views the rail opens, plus `profile`.
    view: PanelView
  }>({ path: [], dir: "forward", view: "menu" })
  // The menu filter. Cleared on every move so a query never lingers over a
  // level it wasn't typed against.
  const [query, setQuery] = React.useState("")

  const { path, dir, view } = nav
  const inProfile = view === "profile"
  const inFavorites = view === "favorites"
  // The rail entry the panel is showing — its title and what fills it.
  // `railViewOf` maps into this very table's keys, so the lookup always lands;
  // the fallback is there for the type checker, not for a real case.
  const rail =
    RAIL_VIEWS.find((v) => v.view === railViewOf(view)) ?? RAIL_VIEWS[0]
  // Read/toggle passed to every leaf row that offers a star, so marking works
  // the same from the menu list, a search result, and the Favorites panel.
  const favorite = React.useMemo<FavoriteControls>(
    () => ({ isFavorite, onToggle: toggle }),
    [isFavorite, toggle]
  )
  // What fills the panel: the top-level tree at the root, else the group's
  // children — falling back to the root so a stale path can't empty the panel.
  const group = groupAtPath(sidebarNav, path)
  const items = path.length === 0 ? sidebarNav : (group?.children ?? sidebarNav)
  // Only the menu drills, so a non-empty path always means a group is showing
  // and the rail's own label is the right title everywhere else.
  const title = inProfile
    ? "Profile"
    : path.length > 0
      ? (group?.label ?? rail.label)
      : rail.label
  // The profile drills, so it can back out; the favorites list is flat, so it
  // can't — only the menu's own path stack and the profile offer a way up.
  const canGoBack = inProfile || path.length > 0

  // The starred screens, grouped by section — derived only while the Favorites
  // panel is the one on screen, so typing in the menu's search doesn't rebuild
  // a list nothing is rendering.
  const favoriteSectionList = React.useMemo(
    () => (inFavorites ? favoriteSections(sidebarNav, favorites) : []),
    [inFavorites, favorites]
  )

  // Search is scoped to what the panel is showing: the favorites when in the
  // Favorites view, else the level in view — flatten its leaves and keep the
  // ones that match. Empty at the menu root means "all screens"; drilled in it
  // means "this section only". Nothing is flattened until something is typed.
  const searching = query.trim().length > 0
  const results = React.useMemo(() => {
    if (!searching) return []
    const source = inFavorites
      ? flattenNav(sidebarNav).filter((c) => isFavorite(c.screen.type))
      : flattenNav(items)
    return filterNavCommands(source, query)
  }, [searching, inFavorites, items, query, isFavorite])

  // Every rail button, in one rule: open the panel (transiently) to the named
  // view when it is shut, switch to that view when another one is showing, and
  // close the panel when it is already showing this view. Opening here never
  // pins — that is the pin button's job alone.
  //
  // "Already showing" is stricter for the menu: a drilled-in level returns to
  // the root rather than closing, so the Menu button is a way back up before it
  // is a way out.
  const toggleTo = React.useCallback(
    (target: RailView) => {
      setQuery("")
      const showing =
        view === target && (target !== "menu" || path.length === 0)
      if (!open) {
        setNav({ path: [], dir: "back", view: target })
        setTransientOpen(true)
      } else if (!showing) {
        setNav({ path: [], dir: "back", view: target })
      } else {
        setPinned(false)
        setTransientOpen(false)
      }
    },
    [open, view, path.length, setPinned, setTransientOpen]
  )

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
              {/* The rail's own buttons, one per view in the table. Only one
                  reads active at a time — the one the panel is showing. */}
              <SidebarMenu className="gap-1">
                {RAIL_VIEWS.map(({ view: v, label, Icon }) => (
                  <SidebarMenuItem key={v}>
                    <SidebarMenuButton
                      aria-label={label}
                      isActive={open && railViewOf(view) === v}
                      className={railButton}
                      onClick={() => toggleTo(v)}
                    >
                      <Icon />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
        <SidebarHeader className="h-12 flex-row items-center gap-2 border-b px-4">
          {/* A slot that opens and shuts for the back button, so drilling in
              slides the title across instead of shoving it aside in one frame.
              The button stays mounted and goes inert when there is nowhere up —
              unmounting it would snap the slot closed. The two negative margins
              are the same optical inset as before (`-ml-1`), plus, while shut,
              the header's own `gap-2` cancelled so the title sits flush with
              the panel's left edge exactly as it did. */}
          <div
            className={cn(
              "shrink-0 overflow-hidden transition-[width,margin] duration-200 ease-out motion-reduce:transition-none",
              canGoBack ? "-ml-1 w-7" : "-ml-2 w-0"
            )}
          >
            <BackButton onClick={back} disabled={!canGoBack} />
          </div>
          <div className="flex-1 truncate text-sm font-medium text-foreground">
            {title}
          </div>
          <PinButton pinned={pinned} onClick={togglePin} />
        </SidebarHeader>
        <SidebarContent className="overflow-x-hidden">
          {inProfile ? (
            // The profile view takes over the whole panel — no search or list.
            <div key="profile" className={cn(ENTER, "slide-in-from-right-4")}>
              <NavProfilePanel user={sidebarUser} />
            </div>
          ) : rail.kind === "placeholder" ? (
            // Placeholder views: a titled but empty panel until real content is
            // wired up.
            <div
              key={view}
              className={cn(
                ENTER,
                "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center text-sm text-muted-foreground slide-in-from-right-4"
              )}
            >
              <rail.Icon strokeWidth={1.5} className="size-6 opacity-60" />
              <p>{rail.label} — coming soon</p>
            </div>
          ) : (
            <>
              {/* Search sits at the very top and filters whatever is in view —
                  the menu level, or the favorites list. */}
              <div className="px-3 pt-3 pb-3">
                <InputGroup className="rounded-full px-1">
                  <InputGroupAddon>
                    <SearchIcon strokeWidth={1.5} />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder={
                      inFavorites ? "Search favorites..." : "Search menu..."
                    }
                    aria-label={
                      inFavorites ? "Search favorites" : "Search menu"
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    // Escape clears the query first and only reaches the panel
                    // once there is nothing left to clear, so a stray keystroke
                    // doesn't throw away the search *and* the panel at once.
                    // `preventDefault` is how that claim is announced — the
                    // shell's window-level handler skips a handled Escape.
                    onKeyDown={(e) => {
                      if (e.key === "Escape" && query.length > 0) {
                        e.preventDefault()
                        setQuery("")
                      }
                    }}
                  />
                  {/* Clear button, inline at the trailing edge — shown only once
                      something is typed, so an empty field stays uncluttered. */}
                  {query.length > 0 && (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                      >
                        <XIcon />
                      </InputGroupButton>
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </div>
              {/* The identity row follows the search at the menu's top level
                  only — once drilled into a section, or over in favorites, the
                  list takes the space. A divider sets it apart from the list
                  below, and clicking it drills into the profile view. */}
              {!inFavorites && path.length === 0 && (
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
                  favorite={favorite}
                />
              ) : inFavorites ? (
                <div
                  key="favorites"
                  className={cn(ENTER, "slide-in-from-right-4")}
                >
                  <NavFavoritesPanel
                    sections={favoriteSectionList}
                    hrefFor={hrefFor}
                    focusedType={focusedType}
                    onNavigate={closeOnNavigate}
                    favorite={favorite}
                  />
                </div>
              ) : (
                // Keyed on the path so each level is its own mount and slides in
                // from the side the move came from — deeper from the right, back
                // from the left. Serialized rather than joined, so a label
                // carrying the separator can't collide with a deeper path.
                <div
                  key={JSON.stringify(path)}
                  className={cn(
                    ENTER,
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
                    favorite={favorite}
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

/**
 * Backs pane 2 up one level — the mirror of drilling into a group. It lives in
 * the header's collapsing slot, so it is `disabled` rather than unmounted when
 * there is nowhere up: a disabled button is unfocusable, which is what keeps
 * the clipped-away slot out of the tab order.
 */
function BackButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  const label = "Back"
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            className="size-7"
            disabled={disabled}
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
