import { cn } from "@/shared/lib/cn"
import type { HTMLAttributes } from "react"
import { tv } from "tailwind-variants"

const track = tv({
  base: "relative w-full overflow-hidden rounded-full bg-glass-2",
  variants: {
    size: {
      sm: "h-1.5",
      md: "h-2",
      lg: "h-3",
    },
  },
  defaultVariants: { size: "sm" },
})

const fill = tv({
  base: "h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
  variants: {
    tone: {
      brand: "bg-[linear-gradient(90deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)]",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
      info: "bg-info",
      muted: "bg-text-muted/40",
    },
  },
  defaultVariants: { tone: "brand" },
})

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly value: number
  readonly max?: number
  readonly size?: "sm" | "md" | "lg"
  readonly tone?: "brand" | "success" | "warning" | "danger" | "info" | "muted"
  readonly label?: string
}

export function Progress({
  value,
  max = 100,
  size,
  tone,
  label,
  className,
  ...props
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(value, max))
  const pct = max > 0 ? (clamped / max) * 100 : 0

  return (
    // biome-ignore lint/a11y/useFocusableInteractive: progressbar es display-only, no requiere foco (WAI-ARIA)
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-label={label}
      className={cn(track({ size }), className)}
      {...props}
    >
      <div className={fill({ tone })} style={{ width: `${pct}%` }} />
    </div>
  )
}
