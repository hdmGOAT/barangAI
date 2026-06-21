import { AreaChart } from "@tremor/react"
import { createFileRoute } from "@tanstack/react-router"
import { Activity, AlertTriangle, Clock, Radio } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import {
  categories,
  logs,
  recentIncidents,
  responseTrend,
  stats,
} from "@/lib/mock-data"
import { StatCard } from "@/components/stat-card"
import { cn } from "@workspace/ui/lib/utils"

export const Route = createFileRoute("/dashboard")({ component: Dashboard })

const icons: LucideIcon[] = [Clock, AlertTriangle, Activity, Radio]

const urgencyClass: Record<string, string> = {
  critical: "bg-urgency-critical/10 text-urgency-critical",
  high: "bg-urgency-high/10 text-urgency-high",
  medium: "bg-urgency-medium/10 text-urgency-medium",
  low: "bg-urgency-low/10 text-urgency-low",
}

function Dashboard() {
  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8">
      <div className="mx-auto grid max-w-7xl gap-5">

        {/* ── Stat cards ──────────────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              unit={stat.unit}
              trend={stat.trend}
              good={stat.good}
              icon={icons[index] ?? Activity}
              progress={stat.good ? 85 : 40}
            />
          ))}
        </section>

        {/* ── SLA chart + Categories ──────────────────────────────── */}
        <section className="grid gap-5 xl:grid-cols-[2fr_0.8fr]">
          <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-lg font-bold">Response Time SLA Trends</h1>
                <p className="text-xs text-muted-foreground">
                  Real-time versus historical target of 5 minutes
                </p>
              </div>
              <span className="text-xl leading-none text-muted-foreground">⋮</span>
            </div>
            <AreaChart
              data={responseTrend}
              index="time"
              categories={["minutes", "target"]}
              colors={["emerald", "red"]}
              showLegend={false}
              showYAxis={false}
              className="h-72"
            />
          </article>

          <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold">Incident Category</h2>
            <div className="mt-5 grid gap-4">
              {categories.map((category) => (
                <div key={category.name}>
                  <div className="mb-1 flex justify-between text-xs font-semibold">
                    <span>{category.name}</span>
                    <span className="text-muted-foreground">{category.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-7 w-full rounded-lg bg-lihok-accent/30 py-3 text-xs font-bold text-lihok-ink transition-colors hover:bg-lihok-accent/50">
              View Full Inventory
            </button>
          </article>
        </section>

        {/* ── Recent Incidents + System Logs ──────────────────────── */}
        <section className="grid gap-5 xl:grid-cols-[2fr_0.8fr]">
          <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold">Recent Incident List</h2>
            <div className="mt-4 divide-y divide-border">
              {recentIncidents.map((incident) => (
                <a
                  key={incident.id}
                  href="/command-center/demo"
                  className="grid gap-1 py-3 text-sm transition-colors hover:text-primary"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-black uppercase",
                        urgencyClass[incident.urgency] ?? urgencyClass.low,
                      )}
                    >
                      {incident.urgency}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {incident.timeAgo}
                    </span>
                  </div>
                  <p className="font-bold">{incident.title}</p>
                  <p className="text-xs text-muted-foreground">{incident.location}</p>
                </a>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold">System Logs</h2>
            <div className="mt-4 grid gap-4">
              {logs.map((log) => (
                <div
                  key={log.message}
                  className="grid grid-cols-[8px_1fr_auto] items-start gap-3 text-xs"
                >
                  <span className="mt-1.5 size-2 rounded-full bg-primary" />
                  <p className="text-foreground/80">{log.message}</p>
                  <span className="text-muted-foreground">{log.timeAgo}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}
