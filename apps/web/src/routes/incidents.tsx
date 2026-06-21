import { createFileRoute } from "@tanstack/react-router"

import { recentIncidents } from "@/lib/mock-data"

export const Route = createFileRoute("/incidents")({ component: Incidents })

function Incidents() {
  return (
    <main className="min-h-full bg-lihok-surface p-8 text-lihok-ink">
      <h1 className="text-2xl font-black tracking-[-0.04em]">Incidents</h1>
      <div className="mt-6 grid gap-3">
        {recentIncidents.map((incident) => (
          <a
            key={incident.id}
            href="/command-center/demo"
            className="rounded-xl border border-border bg-card p-4 font-bold shadow-sm transition-colors hover:bg-muted"
          >
            {incident.title}
          </a>
        ))}
      </div>
    </main>
  )
}
