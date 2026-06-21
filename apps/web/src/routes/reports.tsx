import { useState } from "react"
import { AreaChart } from "@tremor/react"
import { createFileRoute } from "@tanstack/react-router"

import { categories, heatZones, responseTrend, stats } from "@/lib/mock-data"
import { cn } from "@workspace/ui/lib/utils"

export const Route = createFileRoute("/reports")({ component: Reports })

const ranges = ["24H", "7D", "30D"] as const

const densityClass: Record<string, string> = {
  safe: "bg-heatmap-safe text-lihok-ink",
  moderate: "bg-heatmap-moderate text-white",
  high: "bg-heatmap-high text-white",
  critical: "bg-heatmap-critical text-white",
}

function Reports() {
  const [range, setRange] = useState<(typeof ranges)[number]>("24H")

  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8">
      <div className="mx-auto grid max-w-7xl gap-6">

        {/* ── Page header + time range toggle ──────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-[-0.04em]">Analytics Performance</h1>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring of barangay response metrics and safety trends.
            </p>
          </div>
          <div className="flex rounded-md border border-border bg-card p-1 text-xs font-bold">
            {ranges.map((item) => (
              <button
                key={item}
                onClick={() => setRange(item)}
                className={cn(
                  "rounded px-4 py-2 text-muted-foreground transition-colors hover:text-lihok-ink",
                  range === item && "bg-lihok-accent/40 text-lihok-ink",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stat cards ───────────────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-3 text-4xl font-black tracking-[-0.06em]">
                {stat.value}
                <span className="text-sm text-muted-foreground">{stat.unit}</span>
              </p>
            </article>
          ))}
        </section>

        {/* ── SLA chart + Categories ────────────────────────────────── */}
        <section className="grid gap-5 xl:grid-cols-[2fr_0.9fr]">
          <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold">Response Time SLA Trends</h2>
            <p className="mb-5 text-xs text-muted-foreground">Current window: {range}</p>
            <AreaChart
              data={responseTrend}
              index="time"
              categories={["minutes", "target"]}
              colors={["teal", "red"]}
              showLegend={false}
              showYAxis={false}
              className="h-72"
            />
          </article>

          <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold">Incident Categories</h2>
            <p className="mb-5 text-xs text-muted-foreground">Breakdown by type</p>
            <div className="grid gap-4">
              {categories.slice(1).map((category) => (
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
            <button className="mt-7 w-full rounded-lg bg-muted py-3 text-xs font-bold transition-colors hover:bg-lihok-accent/30">
              View Full Inventory
            </button>
          </article>
        </section>

        {/* ── Purok Heat Map ────────────────────────────────────────── */}
        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Purok Heat Map</h2>
              <p className="text-xs text-muted-foreground">
                Density analysis by residential sector
              </p>
            </div>
            <span className="text-xs text-muted-foreground">Low ▪ ▪ ▪ ▪ High</span>
          </div>
          <div className="grid min-h-80 grid-cols-2 gap-3 md:grid-cols-6">
            {heatZones.map((zone, index) => (
              <button
                key={zone.zone}
                className={cn(
                  "flex min-h-28 flex-col justify-end rounded-lg p-4 text-left shadow-inner transition-opacity hover:opacity-90",
                  densityClass[zone.density],
                  index === 1 && "md:col-span-2",
                  index === 5 && "md:col-span-2",
                )}
              >
                <span className="text-[10px] font-bold uppercase opacity-80">
                  {zone.zone}
                </span>
                <span className="text-xs font-black">{zone.label}</span>
              </button>
            ))}
          </div>
        </article>
      </div>
    </main>
  )
}
