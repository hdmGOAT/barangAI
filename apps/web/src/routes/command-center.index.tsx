import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/command-center/")({ component: CommandCenterLanding })

function CommandCenterLanding() {
  return (
    <main
      className="flex min-h-full items-center justify-center bg-lihok-surface p-4 text-lihok-ink"
      data-testid="command-center-landing"
    >
      <div className="text-center">
        <p className="text-lg font-bold">Command Center</p>
        <p className="mt-1 text-sm text-muted-foreground">Select an incident first</p>
      </div>
    </main>
  )
}
