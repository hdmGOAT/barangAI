import { Link, useRouterState, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Radio,
  Settings,
} from "lucide-react"

import { useAuth } from "@/lib/auth"
import { TopBarSearch } from "@/components/top-bar-search"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/command-center", label: "Command Center", icon: Radio },
  { href: "/map", label: "Map", icon: Map },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function CurrentTime() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  )
  useEffect(() => {
    const timer = setInterval(
      () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      60000,
    )
    return () => clearInterval(timer)
  }, [])
  return <>{time}</>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { user, session, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.full_name ?? session?.user.email ?? "User"
  const displayRole = user?.role ?? "User"
  const initials = user?.full_name ? getInitials(user.full_name) : (session?.user.email?.[0]?.toUpperCase() ?? "U")

  const handleSignOut = async () => {
    await signOut()
    await navigate({ to: "/login" })
  }

  return (
    <SidebarProvider style={{ "--sidebar-width-icon": "5rem" } as any} data-testid="app-shell">
      <Sidebar collapsible="icon" className="border-r border-border">
        {/* Logo */}
        <SidebarHeader className="h-20 justify-center px-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-4">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary group-data-[collapsible=icon]:size-11">
              <Radio className="size-5" />
            </span>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-xl font-black tracking-[-0.04em]">LihokBarangAI</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Admin Console
              </p>
            </div>
          </div>
        </SidebarHeader>

        {/* Nav */}
        <SidebarContent className="px-4 pt-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-6">
          <SidebarGroup className="p-0">
            <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-6" data-testid="sidebar-nav">
              {navItems.map((item) => {
                const Icon = item.icon
                const section = `/${item.href.split("/")[1]}`
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(section))

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        "h-11 gap-3 px-4 text-sm text-muted-foreground hover:bg-primary/10 hover:text-lihok-ink",
                        active &&
                          "bg-lihok-accent/40 font-semibold text-lihok-ink hover:bg-lihok-accent/50 hover:text-lihok-ink data-[active=true]:bg-lihok-accent/40 data-[active=true]:font-semibold data-[active=true]:text-lihok-ink",
                        "group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!rounded-2xl group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center"
                      )}
                    >
                      <Link to={item.href}>
                        <Icon className="size-4 shrink-0 group-data-[collapsible=icon]:!size-5" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* User profile */}
        <SidebarFooter className="border-t border-border p-5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-6">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="size-10 group-data-[collapsible=icon]:size-11">
              <AvatarFallback className="bg-lihok-accent text-sm font-bold text-lihok-ink">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {displayRole}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start gap-3 px-2 text-muted-foreground hover:bg-transparent hover:text-foreground group-data-[collapsible=icon]:hidden"
            data-testid="sign-out-button"
            onClick={handleSignOut}
          >
            <LogOut className="size-4 shrink-0" />
            <span>Sign Out</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      {/* ── Main column ────────────────────────────────────────────── */}
      <SidebarInset className="grid h-svh grid-cols-1 grid-rows-[auto_1fr_64px] overflow-hidden bg-lihok-surface">
        {/* Top bar */}
        <header className="border-b border-border bg-card px-4 py-3 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <SidebarTrigger className="text-muted-foreground" />
              <TopBarSearch className="min-w-0" />
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Bell className="size-5" />
              <span className="grid size-7 place-items-center rounded-full border border-border text-xs font-semibold lg:hidden">
                {initials}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="min-w-0 overflow-auto">{children}</div>

        {/* Live alert bar */}
        <footer
          className="flex items-center gap-4 border-t border-border bg-card px-4 text-sm lg:px-8"
          aria-live="polite"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-live-alert-bg text-live-alert">
            <Radio className="size-4 animate-[live-pulse_2s_ease-in-out_infinite]" />
          </span>
          <div className="min-w-28 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-live-alert">
              Live Alerts
            </p>
            <p className="font-semibold text-lihok-ink">Feed Active</p>
          </div>
          <p className="truncate text-muted-foreground">System nominal</p>
          <span className="ml-auto hidden shrink-0 text-muted-foreground sm:block"><CurrentTime /></span>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
