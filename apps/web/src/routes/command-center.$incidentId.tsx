import { createFileRoute } from "@tanstack/react-router"
import { Brain, Megaphone, Send, Share2 } from "lucide-react"

import { logs, smsFeed } from "@/lib/mock-data"
import { AiUrgencyPanel } from "@/components/ai-urgency-panel"
import { BroadcastForm } from "@/components/broadcast-form"
import { SectionCard } from "@/components/section-card"
import { SmsFeedTable } from "@/components/sms-feed-table"
import { SystemLogFeed } from "@/components/system-log-feed"
import { UrgencyBadge } from "@/components/urgency-badge"
import { cn } from "@workspace/ui/lib/utils"

export const Route = createFileRoute("/command-center/$incidentId")({
  component: CommandCenter,
})

function CommandCenter() {
  const { incidentId } = Route.useParams()

  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8">
      <div className="grid w-full gap-6 xl:grid-cols-[1fr_340px]">

        {/* ── Left: Incident Detail ────────────────────────────────── */}
        <SectionCard>
          <div className="border-t-4 border-primary pt-6">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <UrgencyBadge level="critical" size="md">
                Critical
              </UrgencyBadge>
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
            <SmsFeedTable entries={smsFeed} />
          </div>
        </SectionCard>

        {/* ── Right: AI + Broadcast + Log ─────────────────────────── */}
        <aside className="grid content-start gap-5">

          {/* AI Urgency Score */}
          <AiUrgencyPanel
            score={98}
            reasoning="Report volume, keyword analysis, and nearby historical flood data indicate immediate intervention."
          />

          {/* Citizen Update Loop */}
          <BroadcastForm
            incidentId={incidentId}
            defaultMessage="Alert: Zone 4 residents, please avoid the main intersection..."
            onSend={async (msg) => {
              console.log("Sending broadcast:", msg)
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }}
          />

          {/* System Log */}
          <SectionCard
            title={<span className="text-xs font-black uppercase tracking-wide text-muted-foreground">System Log</span>}
            variant="dashed"
          >
            <SystemLogFeed entries={logs} variant="plain" />
          </SectionCard>
        </aside>
      </div>
    </main>
  )
}
