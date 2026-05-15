import { cn } from "@/shared/lib/cn"
import { AlertCircle, CheckCircle2, Clock, Info, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type Tone = "info" | "success" | "warning" | "danger" | "neutral"

/**
 * Banner — feedback funcional o callout informativo.
 *
 * Identidad NexoTT (dos modos según semántica):
 *
 * - `tone="danger" | "warning" | "success"` — **feedback funcional**. Fondo
 *   soft + borde lateral 4px en color del tono. Comunican urgencia/estado.
 *   Saturados a propósito (Apple/Stripe/Linear saturan también para estos).
 *
 * - `tone="info" | "neutral"` — **callout informativo**. Sin fondo saturado.
 *   Icono en círculo soft + tipografía editorial. Para contexto no urgente
 *   (configuración pendiente, vista parcial, pistas).
 *
 * Regla: la aurora NUNCA aparece en banners (es marca, no feedback).
 */

const iconByTone: Record<Tone, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: Clock,
  danger: AlertCircle,
  neutral: Info,
}

const SATURADO: Record<"success" | "warning" | "danger", string> = {
  success: "bg-success-soft border-success/15 border-l-success text-success-on-soft",
  warning: "bg-warning-soft border-warning/15 border-l-warning text-warning-on-soft",
  danger: "bg-danger-soft border-danger/15 border-l-danger text-danger-on-soft",
}

const CALLOUT: Record<"info" | "neutral", { iconBg: string; iconText: string }> = {
  info: { iconBg: "bg-info-soft", iconText: "text-info-on-soft" },
  neutral: { iconBg: "bg-subtle", iconText: "text-text-secondary" },
}

interface BannerProps {
  readonly tone?: Tone
  readonly title?: string
  readonly children: ReactNode
  readonly icon?: LucideIcon
  readonly className?: string
}

export function Banner({ tone = "info", title, children, icon, className }: BannerProps) {
  const Icon = icon ?? iconByTone[tone]

  if (tone === "info" || tone === "neutral") {
    const estilo = CALLOUT[tone]
    return (
      <output
        className={cn(
          "flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3.5",
          className,
        )}
      >
        <div
          aria-hidden={true}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            estilo.iconBg,
            estilo.iconText,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-0.5 pt-1">
          {title ? <p className="font-medium text-body text-text-primary">{title}</p> : null}
          <div className="text-body-sm text-text-secondary">{children}</div>
        </div>
      </output>
    )
  }

  return (
    <output
      className={cn(
        "flex items-start gap-3 rounded-xl border border-l-4 px-4 py-3.5 text-body-sm",
        SATURADO[tone],
        className,
      )}
    >
      <Icon className="mt-[2px] h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        {title ? <p className="font-medium">{title}</p> : null}
        <div>{children}</div>
      </div>
    </output>
  )
}
