import type { LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

export interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: string
  good?: boolean
  icon?: LucideIcon
  progress?: number
  className?: string
}

export function StatCard({
  label,
  value,
  unit,
  trend,
  good = true,
  icon: Icon,
  progress = 75,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("transition-transform hover:-translate-y-0.5 shadow-sm border-border bg-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-0">
        <CardTitle className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </CardTitle>
        {Icon && <Icon className="size-4 text-primary" />}
      </CardHeader>
      <CardContent className="p-5 pt-3">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black tracking-[-0.06em] text-foreground">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-semibold text-muted-foreground">
              {unit}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                "ml-2 text-xs font-bold",
                good ? "text-primary" : "text-urgency-critical"
              )}
            >
              {trend}
            </span>
          )}
        </div>
        <Progress 
          value={progress} 
          className="mt-4 h-2 bg-muted [&_[data-slot=progress-indicator]]:bg-lihok-accent" 
        />
      </CardContent>
    </Card>
  )
}
