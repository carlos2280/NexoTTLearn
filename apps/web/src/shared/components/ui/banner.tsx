import { cn } from "@/shared/lib/cn"
import { AlertCircle, CheckCircle2, Clock, Info, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { type VariantProps, tv } from "tailwind-variants"

const bannerStyles = tv({
  base: ["flex items-start gap-3 rounded-md border px-4 py-3 text-body-sm"],
  variants: {
    tone: {
      info: "bg-info-soft border-info-soft text-info-on-soft",
      success: "bg-success-soft border-success-soft text-success-on-soft",
      warning: "bg-warning-soft border-warning-soft text-warning-on-soft",
      danger: "bg-danger-soft border-danger-soft text-danger-on-soft",
      neutral: "bg-subtle border-border text-text-secondary",
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
