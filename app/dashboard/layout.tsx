// Breadcrumb hidden for now — restore alongside the header trail below.
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb"
import { HeaderNotifications } from "@/components/header-notifications"
import { HeaderSearch } from "@/components/header-search"
// import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { SidebarShell } from "@/components/sidebar-shell"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { sidebarWorkspace } from "@/lib/fixtures"
import { NuqsAdapter } from "nuqs/adapters/next/app"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NuqsAdapter>
      <SidebarShell
        header={
          // The full-width app bar: brand at the far left (above the rail),
          // then the breadcrumb, with the header tools pinned to the right. It
          // spans the whole top; the sidebar starts beneath it.
          <header className="relative z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center [&_svg]:size-5!">
                {sidebarWorkspace.logo}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {sidebarWorkspace.name}
              </span>
            </div>
            {/* Separator hidden with the breadcrumb — restore alongside it.
            <Separator
              orientation="vertical"
              className="mx-1 data-vertical:h-4 data-vertical:self-auto"
            />
            */}
            {/* Mobile only: below `md` the sidebar is an off-canvas sheet with
                nothing on screen to press, so it needs an outside way in. On a
                desktop the rail carries its own controls, so this is hidden. */}
            <Tooltip>
              <TooltipTrigger
                render={<SidebarTrigger className="md:hidden" />}
              />
              <TooltipContent>Toggle Sidebar</TooltipContent>
            </Tooltip>
            {/* Breadcrumb hidden for now — restore when the real trail lands.
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Build Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            */}
            <div className="ml-auto flex items-center gap-2">
              <HeaderNotifications />
              <HeaderSearch />
            </div>
          </header>
        }
      >
        {/* `z-0` makes the content its own stacking context, so the sticky
            table header (and anything else that raises itself above its
            neighbours) stays under the sidebar when it expands. */}
        <SidebarInset className="relative z-0 min-h-0 overflow-hidden">
          {children}
        </SidebarInset>
      </SidebarShell>
    </NuqsAdapter>
  )
}
