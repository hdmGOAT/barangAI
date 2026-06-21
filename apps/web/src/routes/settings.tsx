import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/settings")({ component: Settings })

function Settings() {
  return (
    <main className="min-h-full bg-lihok-surface p-8 text-lihok-ink">
      <h1 className="text-2xl font-black tracking-[-0.04em]">Settings</h1>
      <p className="mt-2 text-muted-foreground">UI placeholder for the hackathon build.</p>
    </main>
  )
}
