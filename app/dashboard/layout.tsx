import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { HeaderNotifications } from "@/components/header-notifications"
import { HeaderSearch } from "@/components/header-search"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { SidebarShell } from "@/components/sidebar-shell"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NuqsAdapter } from "nuqs/adapters/next/app"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NuqsAdapter>
      <SidebarShell>
        {/* `z-0` makes the content its own stacking context, so the sticky
            table header (and anything else that raises itself above its
            neighbours) stays under the sidebar when a peek expands it. */}
        <SidebarInset className="relative z-0 min-h-0 overflow-hidden">
          {/* The header shrinks with the collapsed rail. A peek expands the
              sidebar without the user asking, so it must not drag the header
              open with it — `data-peek` holds the collapsed height. */}
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 group-data-[peek]/sidebar-wrapper:h-12">
            <div className="flex flex-1 items-center gap-2 px-4">
              <Tooltip>
                <TooltipTrigger render={<SidebarTrigger className="-ml-1" />} />
                <TooltipContent>Toggle Sidebar</TooltipContent>
              </Tooltip>
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
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
              <div className="ml-auto flex items-center gap-2">
                <HeaderNotifications />
                <HeaderSearch />
              </div>
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarShell>
    </NuqsAdapter>
  )
}
