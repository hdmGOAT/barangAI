import { Link, useRouterState } from "@tanstack/react-router"
import {
  AlertTriangle,
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Radio,
  Search,
  Settings,
} from "lucide-react"

import { logs } from "@/lib/mock-data"
import { cn } from "@workspace/ui/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/command-center/demo", label: "Command Center", icon: Radio },
  { href: "/map", label: "Map", icon: Map },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const latestLog = logs[0] ?? { message: "System nominal", timeAgo: "" }

  return (
    <div className="grid min-h-svh grid-cols-1 bg-lihok-surface text-lihok-ink lg:grid-cols-[244px_1fr]">
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden border-r border-border bg-card lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 px-6">
          <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
            <Radio className="size-5" />
          </span>
          <div>
            <p className="text-xl font-black tracking-[-0.04em]">LihokBarangAI</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Admin Console
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const section = `/${item.href.split("/")[1]}`
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(section))

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-lihok-ink",
                  active &&
                    "border-l-4 border-primary bg-lihok-accent/40 font-semibold text-lihok-ink",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User profile */}
        <div className="border-t border-border p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-lihok-accent text-sm font-bold text-lihok-ink">
              JD
            </span>
            <div>
              <p className="text-sm font-semibold">Juan Dela Cruz</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Brgy. Captain
              </p>
            </div>
          </div>
          <button className="mt-5 flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <LogOut className="size-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main column ────────────────────────────────────────────── */}
      <div className="grid min-h-svh grid-rows-[auto_1fr_64px] overflow-hidden">
        {/* Top bar */}
        <header className="border-b border-border bg-card px-4 py-3 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Search className="size-4 shrink-0" />
              <span className="truncate">Search incidents, reports, or citizens...</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Bell className="size-5" />
              <span className="grid size-7 place-items-center rounded-full border border-border text-xs font-semibold">
                JD
              </span>
            </div>
          </div>

          {/* Mobile nav strip */}
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => {
              const active = pathname.startsWith(`/${item.href.split("/")[1]}`)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors",
                    active && "bg-lihok-accent/40 text-lihok-ink",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </header>

        {/* Page content */}
        <div className="overflow-auto">{children}</div>

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
          <p className="truncate text-muted-foreground">{latestLog.message}</p>
          <span className="ml-auto hidden shrink-0 text-muted-foreground sm:block">13:58</span>
        </footer>
      </div>
    </div>
  )
}
