import { cn } from "@/shared/lib/cn"
import type { ReactNode } from "react"

interface ChartCardProps {
  readonly title: string
  readonly subtitle?: string
  readonly badge?: ReactNode
  readonly children: ReactNode
  readonly className?: string
}

export function ChartCard({ title, subtitle, badge, children, className }: ChartCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-lg)]",
        "border border-[var(--glass-border)] bg-[var(--surface-1)]",
        "p-5 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-semibold text-[var(--text-primary)] text-sm tracking-tight">
            {title}
          </h3>
          {subtitle && <p className="text-[var(--text-muted)] text-xs">{subtitle}</p>}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
