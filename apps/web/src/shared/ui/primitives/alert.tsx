import { cn } from "@/shared/lib/cn"
import { AlertCircle, CheckCircle2, Info, type LucideIcon, TriangleAlert } from "lucide-react"
import type { ReactNode } from "react"
import { type VariantProps, tv } from "tailwind-variants"

const alert = tv({
  slots: {
    root: [
      "flex items-start gap-3 rounded-[var(--radius-md)] px-4 py-3",
      "border text-sm leading-relaxed",
    ],
    icon: "mt-0.5 size-4 shrink-0",
  },
  variants: {
    variant: {
      info: {
        root: "bg-[rgb(56_189_248/0.08)] border-info/30 text-text-primary",
        icon: "text-info",
      },
      success: {
        root: "bg-[rgb(16_185_129/0.08)] border-success/30 text-text-primary",
        icon: "text-success",
      },
      warning: {
        root: "bg-[rgb(245_158_11/0.08)] border-warning/30 text-text-primary",
        icon: "text-warning",
      },
      error: {
        root: "bg-[rgb(244_63_94/0.08)] border-danger/30 text-text-primary",
        icon: "text-danger",
      },
    },
  },
  defaultVariants: {
    variant: "info",
  },
})

const iconMap: Record<NonNullable<VariantProps<typeof alert>["variant"]>, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
}

export interface AlertProps extends VariantProps<typeof alert> {
  readonly children: ReactNode
  readonly className?: string
  readonly icon?: LucideIcon | false
}

export function Alert({ children, className, variant = "info", icon }: AlertProps) {
  const styles = alert({ variant })
  const v = variant ?? "info"
  const ResolvedIcon = icon === false ? null : (icon ?? iconMap[v])
  return (
    <div role="alert" className={cn(styles.root(), className)}>
      {ResolvedIcon ? <ResolvedIcon aria-hidden="true" className={styles.icon()} /> : null}
      <div className="flex-1">{children}</div>
    </div>
  )
}
