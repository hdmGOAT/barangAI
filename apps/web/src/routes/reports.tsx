import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Activity, AlertTriangle, Clock, Radio } from "lucide-react"

import {
  getDashboardStats,
  getCategories,
  getResponseTrend,
} from "@/lib/queries"
import { StatCard } from "@/components/stat-card"
import type { StatCardVariant } from "@/components/stat-card"
import { CategoryBar } from "@/components/category-bar"
import { SectionCard } from "@/components/section-card"
import { PageHeader } from "@/components/page-header"
import { CardMenu } from "@/components/card-menu"
import { SlaTrendChart } from "@/components/sla-trend-chart"
import { TimeRangeToggle } from "@/components/time-range-toggle"
import type { TimeRange } from "@/components/time-range-toggle"
import { HeatZoneCell } from "@/components/heat-zone-cell"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/reports")({ component: Reports })

const statIcons = [Clock, AlertTriangle, Activity, Radio]
const statVariants: StatCardVariant[] = ["trend", "sparkline", "progressCheck", "pills"]

// ponytail: heat zones are static — computed from geospatial data later
const heatZones = [
  { zone: "ZONE 01", label: "Safe Level", density: "safe" as const },
  { zone: "ZONE 02-03", label: "Increased Activity", density: "high" as const, wideOnMd: true },
  { zone: "ZONE 04", label: "Safe Level", density: "safe" as const },
  { zone: "ZONE 05", label: "High Density", density: "critical" as const },
  { zone: "ZONE 06", label: "Moderate", density: "moderate" as const },
  { zone: "ZONE 07-08", label: "Critical Area", density: "critical" as const, wideOnMd: true },
  { zone: "ZONE 09", label: "Moderate", density: "moderate" as const },
  { zone: "ZONE 10", label: "Safe Level", density: "safe" as const },
  { zone: "ZONE 11-12", label: "Increased Activity", density: "high" as const },
]

function Reports() {
  const [range, setRange] = useState<TimeRange>("24H")
  const [stats, setStats] = useState<Record<string, any>>({})
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([])
  const [trend, setTrend] = useState<Awaited<ReturnType<typeof getResponseTrend>>>([])

  useEffect(() => {
    async function load() {
      try {
        const [s, c, t] = await Promise.all([
          getDashboardStats(),
          getCategories(),
          getResponseTrend(),
        ])
        setStats(s)
        setCategories(c)
        setTrend(t)
      } catch (err) {
        console.error("Reports load error:", err)
      }
    }
    load()
  }, [])

  const statArray = [
    stats.avgResponseTime,
    stats.totalIncidentsStat,
    stats.dispatchEfficiency,
    stats.activePatrols,
  ].filter(Boolean)

  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8" data-testid="reports-page">
      <div className="grid w-full gap-6">
        <PageHeader
          title="Analytics Performance"
          description="Real-time monitoring of barangay response metrics and safety trends."
          action={<TimeRangeToggle value={range} onChange={setRange} />}
        />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <SectionCard
            title={<span className="text-lg font-bold">Response Time SLA Trends</span>}
            description="Real-time versus historical target of 5 minutes"
            action={<CardMenu />}
          >
            <SlaTrendChart data={trend} className="mt-2" />
          </SectionCard>
          <SectionCard title="Incident Categories" description="Breakdown by type" action={<CardMenu />}>
            <div className="grid gap-4">
              {categories.map((category) => (
                <CategoryBar key={category.name} name={category.name} percentage={category.percentage} />
              ))}
            </div>
            <Button variant="secondary" className="mt-7 w-full py-6 text-xs font-bold hover:bg-lihok-accent/30 hover:text-lihok-ink">
              Download Category Report
            </Button>
          </SectionCard>
        </div>
        <SectionCard
          title="Purok Heat Map"
          description="High density zones requiring immediate resource allocation"
          action={<CardMenu />}
        >
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {heatZones.map((zone) => (
              <HeatZoneCell
                key={zone.zone}
                zone={zone.zone}
                label={zone.label}
                density={zone.density}
                wideOnMd={zone.wideOnMd}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </main>
  )
}
