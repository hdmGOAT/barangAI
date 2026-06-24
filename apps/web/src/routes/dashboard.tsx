import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Activity, AlertTriangle, Clock, Radio } from "lucide-react"

import { StatCard } from "@/components/stat-card"
import type { StatCardVariant } from "@/components/stat-card"
import { CategoryBar } from "@/components/category-bar"
import { SectionCard } from "@/components/section-card"
import { IncidentRow } from "@/components/incident-row"
import { SystemLogFeed } from "@/components/system-log-feed"
import { SlaTrendChart } from "@/components/sla-trend-chart"
import { CardMenu } from "@/components/card-menu"
import { Button } from "@workspace/ui/components/button"
import {
  getDashboardStats,
  getRecentIncidents,
  getSystemLogs,
  getCategories,
  getResponseTrend,
} from "@/lib/queries"
import { useRealtimeTable } from "@/hooks/use-realtime"
import type { SystemLog } from "@/lib/types"

export const Route = createFileRoute("/dashboard")({ component: Dashboard })

const statIcons = [Clock, AlertTriangle, Activity, Radio]
const statVariants: StatCardVariant[] = ["trend", "sparkline", "progressCheck", "pills"]

function Dashboard() {
  const [stats, setStats] = useState<Record<string, any>>({})
  const [incidents, setIncidents] = useState<Awaited<ReturnType<typeof getRecentIncidents>>>([])
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([])
  const [trend, setTrend] = useState<Awaited<ReturnType<typeof getResponseTrend>>>([])
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [logsUnavailable, setLogsUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)

  const liveLogs = useRealtimeTable("system_logs", logs)

  useEffect(() => {
    async function load() {
      try {
        const [s, i, c, t] = await Promise.all([
          getDashboardStats(),
          getRecentIncidents(5),
          getCategories(),
          getResponseTrend(),
        ])
        setStats(s)
        setIncidents(i)
        setCategories(c)
        setTrend(t)
      } catch (err) {
        console.error("Dashboard load error:", err)
      } finally {
        setLoading(false)
      }
    }
    load()

    getSystemLogs(5)
      .then((data) => {
        setLogs(data)
        setLogsUnavailable(false)
      })
      .catch((err) => {
        console.error("System logs unavailable:", err)
        setLogs([])
        setLogsUnavailable(true)
      })
  }, [])

  if (loading) {
    return (
      <main className="flex min-h-full items-center justify-center bg-lihok-surface p-4 text-lihok-ink" data-testid="loading-state">
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </main>
    )
  }

  const statArray = [
    stats.avgResponseTime,
    stats.totalIncidentsStat,
    stats.dispatchEfficiency,
    stats.activePatrols,
  ].filter(Boolean)

  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8" data-testid="dashboard-page">
      <div className="grid w-full gap-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="stats-section">
          {statArray.map((stat, index) => {
            const variant = statVariants[index] ?? "trend"
            return (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={
                  variant === "pills"
                    ? stats.activePatrols?.value ?? "0"
                    : variant === "progressCheck"
                      ? stats.dispatchEfficiencyValue ?? 98.4
                      : stat.value
                }
                unit={stat.unit}
                trend={variant === "pills" ? undefined : stat.trend}
                good={stat.good}
                icon={statIcons[index] ?? Activity}
                variant={variant}
                progress={variant === "progressCheck" ? stats.dispatchEfficiencyValue ?? 85 : 85}
                sparkline={variant === "sparkline" ? stats.totalIncidentsSparkline : undefined}
                pills={variant === "pills" ? stats.activePatrolsTeams : undefined}
                fraction={variant === "pills" ? { total: stats.activePatrolsTotal ?? 0 } : undefined}
              />
            )
          })}
        </section>
        <section className="grid gap-5 xl:grid-cols-[2fr_0.8fr]">
          <SectionCard
            title={<span className="text-lg font-bold">Response Time SLA Trends</span>}
            description="Real-time average historical target of 5 minutes"
            action={<CardMenu />}
          >
            <SlaTrendChart data={trend} className="mt-2" />
          </SectionCard>
          <SectionCard title="Incident Category">
            <div className="grid gap-4 mt-2">
              {categories.map((category) => (
                <CategoryBar key={category.name} name={category.name} percentage={category.percentage} />
              ))}
            </div>
            <Button className="mt-7 w-full bg-lihok-accent/30 py-6 text-xs font-bold text-lihok-ink hover:bg-lihok-accent/50 hover:text-lihok-ink">
              View Full Inventory
            </Button>
          </SectionCard>
        </section>
        <section className="grid gap-5 xl:grid-cols-[2fr_0.8fr]">
          <SectionCard title="Recent Incident List" action={<CardMenu />} data-testid="recent-incidents-section">
            <div className="grid divide-y divide-border">
              {incidents.map((incident) => (
                <IncidentRow
                  key={incident.id}
                  id={incident.id}
                  title={incident.title}
                  location={incident.location}
                  urgency={incident.urgency}
                  timeAgo={incident.timeAgo}
                />
              ))}
            </div>
          </SectionCard>
          <SectionCard title="System Logs" action={<CardMenu />} data-testid="system-logs-section">
            {logsUnavailable ? (
              <p className="text-sm text-muted-foreground">System logs unavailable</p>
            ) : liveLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent alerts</p>
            ) : (
              <SystemLogFeed
                entries={liveLogs.map((l) => ({ message: l.message, timeAgo: formatTimeAgo(l.created_at) }))}
                variant="dotted"
              />
            )}
          </SectionCard>
        </section>
      </div>
    </main>
  )
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}
