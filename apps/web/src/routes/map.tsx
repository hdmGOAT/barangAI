import { createFileRoute } from "@tanstack/react-router"
import { Layers, LocateFixed, Minus, Plus, Siren } from "lucide-react"

import { LeafletMap } from "@/components/leaflet-map"
import { PersonnelCard } from "@/components/personnel-card"
import { UrgencyBadge } from "@/components/urgency-badge"
import { personnel } from "@/lib/mock-data"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export const Route = createFileRoute("/map")({ component: MapPage })

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
      <Button className="absolute right-6 top-5 z-[500] flex h-11 items-center gap-2 rounded-lg bg-lihok-dark px-5 py-3 text-sm font-bold text-white shadow-xl transition-opacity hover:bg-lihok-dark/90 hover:opacity-90">
        <Siren className="size-4" />
        Emergency Dispatch
      </Button>

      {/* Map controls — bottom-left */}
      <div className="absolute bottom-24 left-6 z-[500] grid gap-2">
        {([Plus, Minus, LocateFixed, Layers] as const).map((Icon) => (
          <Button
            key={Icon.displayName ?? Icon.name}
            variant="secondary"
            size="icon"
            className="size-10 rounded-lg bg-card/90 shadow transition-colors hover:bg-card"
          >
            <Icon className="size-5 text-foreground" />
          </Button>
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
            <PersonnelCard
              key={unit.name}
              name={unit.name}
              location={unit.location}
              status={unit.status}
              action={unit.action}
            />
          ))}
        </div>

        <Button variant="secondary" className="mt-6 w-full py-6 text-sm font-semibold shadow-sm transition-colors hover:bg-muted">
          Manage All Teams
        </Button>
      </aside>
    </main>
  )
}
