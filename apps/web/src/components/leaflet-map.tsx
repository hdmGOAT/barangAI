import { useEffect, useState } from "react"
import "leaflet/dist/leaflet.css"
import type * as Leaflet from "leaflet"

import { mapIncidents } from "@/lib/mock-data"

type LeafletModules = {
  MapContainer: React.ComponentType<Record<string, unknown>>
  TileLayer: React.ComponentType<Record<string, unknown>>
  Marker: React.ComponentType<Record<string, unknown>>
  Popup: React.ComponentType<Record<string, unknown>>
  divIcon: typeof Leaflet.divIcon
}

/** Marker HTML — uses the CSS variable so theming is consistent */
const MARKER_HTML = `
  <span style="
    display:block;
    width:14px;height:14px;
    border-radius:999px;
    background:var(--urgency-low);
    box-shadow:0 0 20px var(--urgency-low);
    border:2px solid white;
  "></span>
`

export function LeafletMap() {
  const [modules, setModules] = useState<LeafletModules | null>(null)

  useEffect(() => {
    let cancelled = false

    void Promise.all([import("react-leaflet"), import("leaflet")]).then(
      ([reactLeaflet, leaflet]) => {
        if (cancelled) return
        setModules({
          MapContainer: reactLeaflet.MapContainer as unknown as LeafletModules["MapContainer"],
          TileLayer: reactLeaflet.TileLayer as unknown as LeafletModules["TileLayer"],
          Marker: reactLeaflet.Marker as unknown as LeafletModules["Marker"],
          Popup: reactLeaflet.Popup as unknown as LeafletModules["Popup"],
          divIcon: leaflet.divIcon,
        })
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  /* Loading skeleton — uses Tailwind token class, no hardcoded gradient */
  if (!modules) {
    return <div className="h-full w-full bg-lihok-ink" />
  }

  const { MapContainer, Marker, Popup, TileLayer, divIcon } = modules
  const markerIcon = divIcon({ className: "", html: MARKER_HTML })

  return (
    <MapContainer
      center={[10.3157, 123.8854]}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
      {mapIncidents.map((incident) => (
        <Marker key={incident.id} position={incident.position} icon={markerIcon}>
          <Popup>{incident.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
