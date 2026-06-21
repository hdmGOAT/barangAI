import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"
import type { HeatDensity } from "@/lib/mock-data"
import { Button } from "@workspace/ui/components/button"

const cellVariants = cva(
  "flex min-h-28 flex-col justify-end rounded-lg p-4 text-left shadow-inner transition-opacity hover:opacity-90",
  {
    variants: {
      density: {
        safe: "bg-heatmap-safe text-lihok-ink",
        moderate: "bg-heatmap-moderate text-white",
        high: "bg-heatmap-high text-white",
        critical: "bg-heatmap-critical text-white",
      },
    },
    defaultVariants: {
      density: "safe",
    },
  }
)

export interface HeatZoneCellProps extends VariantProps<typeof cellVariants> {
  zone: string
  label: string
  density: HeatDensity
  wideOnMd?: boolean
  onClick?: () => void
  className?: string
}

export function HeatZoneCell({
  zone,
  label,
  density,
  wideOnMd,
  onClick,
  className,
}: HeatZoneCellProps) {
  return (
    <Button
      variant="ghost"
      className={cn("h-auto flex-col items-start justify-end hover:bg-transparent", cellVariants({ density }), wideOnMd && "md:col-span-2", className)}
      onClick={onClick}
      aria-label={`${zone}: ${label}`}
    >
      <span className="text-[10px] font-bold uppercase opacity-80">{zone}</span>
      <span className="text-xs font-black">{label}</span>
    </Button>
  )
}
