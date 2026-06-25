import { useState } from "react"
import { Megaphone } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { SectionCard } from "@/components/section-card"

export interface BroadcastFormProps {
  incidentId: string
  defaultMessage?: string
  onSend?: (message: string) => Promise<void>
  className?: string
  disabled?: boolean
}

export function BroadcastForm({
  incidentId,
  defaultMessage = "",
  onSend,
  className,
  disabled = false,
}: BroadcastFormProps) {
  const [message, setMessage] = useState(defaultMessage)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!onSend || !message.trim()) return
    setSending(true)
    try {
      await onSend(message)
    } finally {
      setSending(false)
    }
  }

  const fieldId = `broadcast-${incidentId}`

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2 text-lg font-bold">
          <Megaphone className="size-5 text-primary" />
          Citizen Update Loop
        </span>
      }
      className={className}
    >
      <div className="mt-5">
        <Label
          htmlFor={fieldId}
          className="block text-xs font-bold uppercase tracking-wide text-muted-foreground"
        >
          Broadcast Message
        </Label>
        <Textarea
          id={fieldId}
          className="mt-2 min-h-28 resize-none border-input bg-muted p-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your alert message..."
          disabled={disabled}
        />
        <Button
          className="mt-4 w-full bg-lihok-accent py-6 font-black text-lihok-ink hover:bg-lihok-accent/90"
          disabled={disabled || sending || !message.trim()}
          onClick={handleSend}
        >
          {disabled ? "Incident Resolved" : sending ? "Sending..." : "Send Alert"}
        </Button>
      </div>
    </SectionCard>
  )
}
