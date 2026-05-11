import { cn } from "@/shared/lib/cn"
import { AlertCircle, CheckCircle2, Clock, Info, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { type VariantProps, tv } from "tailwind-variants"

const bannerStyles = tv({
  base: [
    "flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3",
    "text-[13px] leading-5",
  ],
  variants: {
    tone: {
      info: "bg-[var(--color-info-soft)] border-[var(--color-info-soft)] text-[#0E7490]",
      success: "bg-[var(--color-success-soft)] border-[var(--color-success-soft)] text-[#15803D]",
      warning: "bg-[var(--color-warning-soft)] border-[var(--color-warning-soft)] text-[#B45309]",
      danger: "bg-[var(--color-danger-soft)] border-[var(--color-danger-soft)] text-[#B91C1C]",
      neutral:
        "bg-[var(--color-subtle)] border-[var(--color-border)] text-[var(--color-text-secondary)]",
    },
  },
  defaultVariants: {
    tone: "info",
  },
})

const iconByTone: Record<NonNullable<VariantProps<typeof bannerStyles>["tone"]>, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: Clock,
  danger: AlertCircle,
  neutral: Info,
}

interface BannerProps extends VariantProps<typeof bannerStyles> {
  readonly title?: string
  readonly children: ReactNode
  readonly icon?: LucideIcon
  readonly className?: string
}

export function Banner(props: BannerProps) {
  const { tone, title, children, icon, className } = props
  const Icon = icon ?? iconByTone[tone ?? "info"]
  return (
    <output className={cn(bannerStyles({ tone }), className)}>
      <Icon className="mt-[2px] h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        {title ? <p className="font-medium">{title}</p> : null}
        <div>{children}</div>
      </div>
    </output>
  )
}
