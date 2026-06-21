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
import { CategoryBar } from "@/components/category-bar"
import { SectionCard } from "@/components/section-card"
import { IncidentRow } from "@/components/incident-row"
import { SystemLogFeed } from "@/components/system-log-feed"
import { cn } from "@workspace/ui/lib/utils"

export const Route = createFileRoute("/dashboard")({ component: Dashboard })

const icons: LucideIcon[] = [Clock, AlertTriangle, Activity, Radio]

function Dashboard() {
  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8">
      <div className="grid w-full gap-5">

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
          <SectionCard
            title={<span className="text-lg font-bold">Response Time SLA Trends</span>}
            action={<span className="text-xl leading-none text-muted-foreground">⋮</span>}
          >
            {/* Note: Tremor chart requires its own padding container */}
            <AreaChart
              className="h-72 mt-2"
              data={responseTrend}
              index="time"
              categories={["minutes", "target"]}
              colors={["emerald", "red"]}
              valueFormatter={(number) => `${number}m`}
              showLegend={false}
              showYAxis={false}
            />
          </SectionCard>

          {/* Incident Categories */}
          <SectionCard
            title="Incident Category"
          >
            <div className="grid gap-4 mt-2">
              {categories.map((category) => (
                <CategoryBar
                  key={category.name}
                  name={category.name}
                  percentage={category.percentage}
                />
              ))}
            </div>
            <button className="mt-7 w-full rounded-lg bg-lihok-accent/30 py-3 text-xs font-bold text-lihok-ink transition-colors hover:bg-lihok-accent/50">
              View Full Inventory
            </button>
          </SectionCard>
        </section>

        {/* ── Recent Incidents + System Logs ──────────────────────── */}
        <section className="grid gap-5 xl:grid-cols-[2fr_0.8fr]">
          {/* Recent Incidents List */}
          <SectionCard title="Recent Incident List">
            <div className="grid divide-y divide-border">
              {recentIncidents.map((incident) => (
                <IncidentRow
                  key={incident.id}
                  id={incident.id}
                  title={incident.title}
                  location={incident.location}
                  urgency={incident.urgency as any}
                  timeAgo={incident.timeAgo}
                />
              ))}
            </div>
          </SectionCard>

          {/* System Logs */}
          <SectionCard
            title="System Logs"
          >
            <SystemLogFeed entries={logs} variant="dotted" />
          </SectionCard>
        </section>
      </div>
    </main>
  )
}
