import { useState } from "react"
import { AreaChart } from "@tremor/react"
import { createFileRoute } from "@tanstack/react-router"

import { categories, heatZones, responseTrend, stats } from "@/lib/mock-data"
import { StatCard } from "@/components/stat-card"
import { CategoryBar } from "@/components/category-bar"
import { SectionCard } from "@/components/section-card"
import { TimeRangeToggle, type TimeRange } from "@/components/time-range-toggle"
import { HeatZoneCell } from "@/components/heat-zone-cell"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export const Route = createFileRoute("/reports")({ component: Reports })

const densityClass: Record<string, string> = {
  safe: "bg-heatmap-safe text-lihok-ink",
  moderate: "bg-heatmap-moderate text-white",
  high: "bg-heatmap-high text-white",
  critical: "bg-heatmap-critical text-white",
}

function Reports() {
  const [range, setRange] = useState<TimeRange>("24H")

  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8">
      <div className="grid w-full gap-6">

        {/* ── Page header + time range toggle ──────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-[-0.04em]">Analytics Performance</h1>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring of barangay response metrics and safety trends.
            </p>
          </div>
          <TimeRangeToggle value={range} onChange={setRange} />
        </div>

        {/* ── Stat cards ───────────────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              unit={stat.unit}
              trend={stat.trend}
              good={stat.good}
              progress={stat.good ? 85 : 40}
            />
          ))}
        </section>

        {/* ── SLA chart + Categories ────────────────────────────────── */}
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <SectionCard
            title={<span className="text-lg font-bold">Response Time SLA Trends</span>}
            description="Real-time versus historical target of 5 minutes"
          >
            <AreaChart
              data={responseTrend}
              index="time"
              categories={["minutes", "target"]}
              colors={["emerald", "red"]}
              showLegend={false}
              showYAxis={false}
              className="h-72 mt-2"
            />
          </SectionCard>

          <SectionCard
            title="Incident Categories"
            description="Breakdown by type"
          >
            <div className="grid gap-4">
              {categories.slice(1).map((category) => (
                <CategoryBar
                  key={category.name}
                  name={category.name}
                  percentage={category.percentage}
                />
              ))}
            </div>
            <Button variant="secondary" className="mt-7 w-full py-6 text-xs font-bold hover:bg-lihok-accent/30 hover:text-lihok-ink">
              Download Category Report
            </Button>
          </SectionCard>
        </div>

        {/* ── Purok Heat Map ────────────────────────────────────────── */}
        <SectionCard
          title="Purok Heat Map"
          description="High density zones requiring immediate resource allocation"
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
