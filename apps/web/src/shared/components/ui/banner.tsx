import { cn } from "@/shared/lib/cn"
import { AlertCircle, CheckCircle2, Clock, Info, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { type VariantProps, tv } from "tailwind-variants"

const bannerStyles = tv({
  // Borde-izquierdo grueso en color sólido del tono + borde sutil al resto.
  // Identidad visual de "callout" — el color sigue siendo SEMÁNTICO (rojo=error,
  // verde=éxito, etc.); la aurora se reserva para CTAs y momentos de marca.
  base: ["flex items-start gap-3 rounded-xl border border-l-4 px-4 py-3.5 text-body-sm"],
  variants: {
    tone: {
      info: "bg-info-soft border-info/15 border-l-info text-info-on-soft",
      success: "bg-success-soft border-success/15 border-l-success text-success-on-soft",
      warning: "bg-warning-soft border-warning/15 border-l-warning text-warning-on-soft",
      danger: "bg-danger-soft border-danger/15 border-l-danger text-danger-on-soft",
      neutral: "bg-subtle border-border border-l-border-emphasis text-text-secondary",
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
