import { createFileRoute } from "@tanstack/react-router"
import { Layers, LocateFixed, Minus, Plus, Siren } from "lucide-react"

import { LeafletMap } from "@/components/leaflet-map"
import { personnel } from "@/lib/mock-data"
import { cn } from "@workspace/ui/lib/utils"

export const Route = createFileRoute("/map")({ component: MapPage })

const statusDot: Record<string, string> = {
  online: "bg-status-verified",
  busy: "bg-urgency-high",
  offline: "bg-urgency-critical",
}

function MapPage() {
  return (
    <main className="relative h-full min-h-[calc(100svh-120px)] overflow-hidden bg-lihok-ink text-lihok-ink">
      {/* Map layer */}
      <div className="absolute inset-0">
        <LeafletMap />
      </div>

      {/* Grid overlay (decorative) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,210,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,210,.06) 1px, transparent 1px)",
          backgroundSize: "92px 92px",
        }}
      />

      {/* Emergency Dispatch — top-right */}
      <button className="absolute right-6 top-5 z-[500] flex items-center gap-2 rounded-lg bg-lihok-dark px-5 py-3 text-sm font-bold text-white shadow-xl transition-opacity hover:opacity-90">
        <Siren className="size-4" />
        Emergency Dispatch
      </button>

      {/* Map controls — bottom-left */}
      <div className="absolute bottom-24 left-6 z-[500] grid gap-2">
        {([Plus, Minus, LocateFixed, Layers] as const).map((Icon) => (
          <button
            key={Icon.displayName ?? Icon.name}
            className="grid size-10 place-items-center rounded-lg bg-card/90 shadow transition-colors hover:bg-card"
          >
            <Icon className="size-5 text-foreground" />
          </button>
        ))}
      </div>

      {/* Personnel panel — right */}
      <aside className="absolute right-6 top-20 z-[500] w-[min(320px,calc(100vw-48px))] rounded-2xl bg-card/90 p-5 shadow-2xl backdrop-blur">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-lg font-bold">Personnel &amp; Units</h1>
          <span className="rounded-full bg-lihok-accent px-3 py-1 text-[10px] font-black text-lihok-ink">
            3 Online
          </span>
        </div>

        <div className="grid gap-4">
          {personnel.map((unit) => (
            <article key={unit.name} className="rounded-xl bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{unit.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{unit.location}</p>
                </div>
                <span
                  className={cn(
                    "mt-1 size-2 rounded-full",
                    statusDot[unit.status] ?? "bg-muted-foreground",
                  )}
                />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3">
                <span className="flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <span key={dot} className="size-4 rounded-full bg-muted" />
                  ))}
                </span>
                <button className="text-sm font-semibold text-lihok-ink transition-colors hover:text-primary">
                  {unit.action}
                </button>
              </div>
            </article>
          ))}
        </div>

        <button className="mt-6 w-full rounded-lg bg-card py-3 text-sm font-semibold shadow-sm transition-colors hover:bg-muted">
          Manage All Teams
        </button>
      </aside>
    </main>
  )
}
