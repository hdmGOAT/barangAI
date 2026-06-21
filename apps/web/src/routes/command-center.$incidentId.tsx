import { createFileRoute } from "@tanstack/react-router"
import { Brain, Megaphone, Send, Share2 } from "lucide-react"

import { logs, smsFeed } from "@/lib/mock-data"
import { cn } from "@workspace/ui/lib/utils"

export const Route = createFileRoute("/command-center/$incidentId")({
  component: CommandCenter,
})

const statusClass: Record<string, string> = {
  verified: "bg-status-verified/20 text-lihok-ink",
  processing: "bg-status-processing/20 text-urgency-medium",
}

function CommandCenter() {
  const { incidentId } = Route.useParams()

  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_340px]">

        {/* ── Left: Incident Detail ────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="border-t-4 border-primary pt-6">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full bg-urgency-critical/10 px-3 py-1 font-black uppercase text-urgency-critical">
                Critical
              </span>
              <span className="text-muted-foreground">Doryduman, Zone 4</span>
              <span className="ml-auto rounded-lg bg-lihok-accent/40 px-4 py-2 font-bold text-lihok-ink">
                5 Linked Reports
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">
              Flooding Cluster: Zone 4
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">Incident ID: {incidentId}</p>
          </div>

          {/* Photo + condition */}
          <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
            <div
              className="min-h-44 rounded-lg bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(7,63,49,.25),rgba(7,63,49,.75)), url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=700&q=80')",
              }}
            />
            <div className="rounded-lg border border-border bg-muted p-5 text-sm leading-7 text-foreground/80">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Current Condition
              </p>
              Rising water levels observed at the intersection of Main St and 4th Ave.
              Multiple resident reports confirm drainage failure.
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex justify-end gap-3 border-b border-border pb-5">
            <button className="flex items-center gap-2 rounded-lg bg-lihok-dark px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
              <Send className="size-4" />
              Dispatch Response Team
            </button>
            <button className="grid size-11 place-items-center rounded-lg border border-border bg-card transition-colors hover:bg-muted">
              <Share2 className="size-4" />
            </button>
          </div>

          {/* SMS Feed */}
          <div className="mt-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              Raw SMS Feed
            </h2>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-muted text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Origin</th>
                    <th className="p-4">Message Content</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {smsFeed.map((sms) => (
                    <tr key={sms.timestamp} className="transition-colors hover:bg-muted/50">
                      <td className="p-4 font-medium">{sms.timestamp}</td>
                      <td className="p-4 font-bold">{sms.origin}</td>
                      <td className="p-4 text-foreground/80">{sms.content}</td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "rounded px-2 py-1 text-[10px] font-black uppercase",
                            statusClass[sms.status] ?? statusClass.processing,
                          )}
                        >
                          {sms.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Right: AI + Broadcast + Log ─────────────────────────── */}
        <aside className="grid content-start gap-5">

          {/* AI Urgency Score */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Brain className="size-5 text-primary" />
                AI Urgency Score
              </h2>
              <span className="rounded bg-lihok-dark px-3 py-2 text-xs font-bold text-white">
                Real-time
              </span>
            </div>
            <p className="mt-5 text-6xl font-black tracking-[-0.08em]">
              98<span className="text-sm text-muted-foreground"> / 100</span>
            </p>
            <div className="mt-4 h-3 rounded-full bg-muted">
              <div className="h-full w-[98%] rounded-full bg-primary" />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Report volume, keyword analysis, and nearby historical flood data
              indicate immediate intervention.
            </p>
          </section>

          {/* Citizen Update Loop */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Megaphone className="size-5 text-primary" />
              Citizen Update Loop
            </h2>
            <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Broadcast Message
            </label>
            <textarea
              className="mt-2 min-h-28 w-full resize-none rounded-lg border border-input bg-muted p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              defaultValue="Alert: Zone 4 residents, please avoid the main intersection..."
            />
            <button className="mt-4 w-full rounded-lg bg-lihok-accent px-5 py-3 text-sm font-black text-lihok-ink transition-opacity hover:opacity-90">
              Send Alert
            </button>
          </section>

          {/* System Log */}
          <section className="rounded-xl border border-dashed border-border bg-card/70 p-6 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-wide text-muted-foreground">
              System Log
            </h2>
            <div className="mt-4 grid gap-4 text-xs text-muted-foreground">
              {logs.map((log) => (
                <p key={log.message}>
                  {log.message}
                  <span className="float-right">{log.timeAgo}</span>
                </p>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}
