import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Layers, LocateFixed, Minus, Plus, Siren } from "lucide-react"

import { LeafletMap } from "@/components/leaflet-map"
import { PersonnelCard } from "@/components/personnel-card"
import { SectionCard } from "@/components/section-card"
import { getMapIncidents, getPersonnel, getIncidents } from "@/lib/queries"
import { useRealtimeTable } from "@/hooks/use-realtime"
import type { Personnel } from "@/lib/types"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/map")({ component: MapPage })

function MapPage() {
  const [mapIncidents, setMapIncidents] = useState<Awaited<ReturnType<typeof getMapIncidents>>>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [personnelUnavailable, setPersonnelUnavailable] = useState(false)

  const liveIncidents = useRealtimeTable("incidents", mapIncidents as any)

  useEffect(() => {
    getMapIncidents()
      .then(setMapIncidents)
      .catch((err) => {
        console.error("Map incidents load error:", err)
        // Fallback: try a broader select without lat/lng columns
        getIncidents().then((incidents) => {
          setMapIncidents(
            incidents.map((i) => ({
              id: i.id,
              title: i.title,
              position: [0, 0] as [number, number],
              urgency: i.urgency ?? "low",
            })),
          )
        }).catch(() => {
          // Both queries failed — show empty map
          setMapIncidents([])
        })
      })

    getPersonnel()
      .then((data) => {
        setPersonnel(data)
        setPersonnelUnavailable(false)
      })
      .catch((err) => {
        console.error("Personnel load error:", err)
        setPersonnel([])
        setPersonnelUnavailable(true)
      })
  }, [])

  const incidentMarkers = (liveIncidents as any[]).map((i: any) => ({
    id: i.id,
    title: i.title,
    position: i.position as [number, number],
    urgency: i.urgency ?? "low",
  }))

  const onlineCount = personnel.filter((p) => p.status === "online").length

  return (
    <main className="relative h-full min-h-[calc(100svh-120px)] overflow-hidden bg-lihok-ink text-lihok-ink" data-testid="map-page">
      <div className="absolute inset-0" data-testid="map-container">
        <LeafletMap incidents={incidentMarkers} />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,210,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,210,.06) 1px, transparent 1px)",
          backgroundSize: "92px 92px",
        }}
      />
      <Button
        variant="emergency"
        className="absolute right-6 top-5 z-[500] flex h-11 items-center gap-2 px-5 py-3 text-sm font-bold transition-opacity hover:opacity-90"
      >
        <Siren className="size-4" />
        Emergency Dispatch
      </Button>
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
      <SectionCard
        title={<span className="text-lg font-bold">Personnel &amp; Units</span>}
        action={
          <span className="rounded-full bg-lihok-accent px-3 py-1 text-[10px] font-black text-lihok-ink">
            {onlineCount} Online
          </span>
        }
        className="absolute right-6 top-20 z-[500] max-h-[calc(100%-7rem)] w-[min(320px,calc(100vw-48px))] min-w-0 overflow-y-auto bg-card/90 shadow-2xl backdrop-blur"
      >
        <div className="grid min-w-0 gap-4">
          {personnelUnavailable ? (
            <p className="text-sm text-muted-foreground">Personnel data unavailable</p>
          ) : personnel.length === 0 ? (
            <p className="text-sm text-muted-foreground">No personnel data</p>
          ) : (
            personnel.map((unit) => (
              <PersonnelCard
                key={unit.id}
                name={unit.team_name}
                location={unit.current_location ?? "Unknown"}
                status={unit.status}
                action="Deploy"
              />
            ))
          )}
        </div>
        <Button variant="secondary" className="mt-6 w-full py-6 text-sm font-semibold shadow-sm transition-colors hover:bg-muted">
          Manage All Teams
        </Button>
      </SectionCard>
    </main>
  )
}
