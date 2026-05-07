import { cn } from "@/shared/lib/cn"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { Card } from "@/shared/ui/primitives/card"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { tv } from "tailwind-variants"

const iconWrap = tv({
  base: "grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] border border-glass-border",
  variants: {
    tone: {
      brand: "bg-[rgb(124_58_237/0.12)] text-brand-violet-soft",
      violet: "bg-[rgb(124_58_237/0.12)] text-brand-violet-soft",
      cyan: "bg-[rgb(34_211_238/0.12)] text-brand-cyan",
      success: "bg-[var(--success-bg)] text-success",
      warning: "bg-[var(--warning-bg)] text-warning",
      danger: "bg-[var(--danger-bg)] text-danger",
      info: "bg-[var(--info-bg)] text-info",
      neutral: "bg-glass-2 text-text-muted",
    },
  },
  defaultVariants: { tone: "brand" },
})

export type StatCardTone =
  | "brand"
  | "violet"
  | "cyan"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"

interface StatCardProps {
  readonly label: ReactNode
  readonly value: ReactNode
  readonly hint?: ReactNode
  readonly icon?: LucideIcon
  readonly tone?: StatCardTone
  readonly loading?: boolean
  readonly className?: string
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
  className,
}: StatCardProps) {
  return (
    <Card variant="glass" padding="md" className={cn("flex items-start gap-3", className)}>
      {Icon ? (
        <span aria-hidden="true" className={iconWrap({ tone })}>
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-medium text-text-secondary text-xs uppercase tracking-wider">
          {label}
        </span>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <span className="font-semibold text-2xl text-text-primary tracking-tight">{value}</span>
        )}
        {hint ? <span className="text-text-muted text-xs leading-relaxed">{hint}</span> : null}
      </div>
    </Card>
  )
}
