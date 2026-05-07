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
      indigo: "bg-[rgb(99_102_241/0.12)] text-[rgb(165_180_252)]",
      emerald: "bg-[rgb(16_185_129/0.12)] text-success",
      amber: "bg-[rgb(245_158_11/0.12)] text-warning",
      rose: "bg-[rgb(244_63_94/0.12)] text-danger",
      sky: "bg-[rgb(56_189_248/0.12)] text-info",
      neutral: "bg-glass-2 text-text-muted",
    },
  },
  defaultVariants: { tone: "brand" },
})

export type SectionCardTone =
  | "brand"
  | "violet"
  | "cyan"
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "neutral"

interface SectionCardProps {
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly icon?: LucideIcon
  readonly iconTone?: SectionCardTone
  readonly actions?: ReactNode
  readonly loading?: boolean
  readonly children?: ReactNode
  readonly className?: string
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  iconTone,
  actions,
  loading,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card variant="glass" padding="lg" className={cn("flex flex-col gap-5", className)}>
      <header className="flex items-start gap-3">
        {Icon ? (
          <span aria-hidden="true" className={iconWrap({ tone: iconTone })}>
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="font-semibold text-base text-text-primary tracking-tight">{title}</h3>
          {description ? (
            <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      {loading ? <Skeleton className="h-24 w-full" /> : children}
    </Card>
  )
}
