import { cn } from "@/shared/lib/cn"
import { Check, ChevronRight, Lock, Sparkles, Triangle } from "lucide-react"
import type { ReactNode } from "react"

type BannerVariant = "borrador-falta" | "borrador-listo" | "activo" | "cerrado"

interface PublishBannerProps {
  readonly variant: BannerVariant
  readonly message: ReactNode
  readonly secondary?: ReactNode
  readonly action?: ReactNode
}

const VARIANTS: Record<
  BannerVariant,
  { readonly bg: string; readonly border: string; readonly icon: ReactNode; readonly tone: string }
> = {
  "borrador-falta": {
    bg: "bg-glass-2",
    border: "border-glass-border",
    tone: "text-text-secondary",
    icon: <Triangle className="size-3.5 text-warning" strokeWidth={2} />,
  },
  "borrador-listo": {
    bg: "bg-[color-mix(in_oklab,var(--success)_8%,transparent)]",
    border: "border-[color-mix(in_oklab,var(--success)_28%,transparent)]",
    tone: "text-text-primary",
    icon: <Sparkles className="size-3.5 text-success" strokeWidth={2} />,
  },
  activo: {
    bg: "bg-[color-mix(in_oklab,var(--success)_8%,transparent)]",
    border: "border-[color-mix(in_oklab,var(--success)_28%,transparent)]",
    tone: "text-text-primary",
    icon: <Check className="size-3.5 text-success" strokeWidth={2} />,
  },
  cerrado: {
    bg: "bg-glass-2",
    border: "border-glass-border",
    tone: "text-text-muted",
    icon: <Lock className="size-3.5 text-text-muted" strokeWidth={2} />,
  },
}

/**
 * Banner persistente bajo el topbar del editor. Una sola fila, 32px alto
 * efectivo. El detalle (checklist, log, lista de candidatos) vive en otro
 * sitio: este es solo señal ambiental.
 */
export function PublishBanner({ variant, message, secondary, action }: PublishBannerProps) {
  const v = VARIANTS[variant]
  return (
    <div
      className={cn("flex h-8 items-center gap-3 border-b px-4 text-xs", v.bg, v.border, v.tone)}
    >
      <span aria-hidden="true" className="flex shrink-0 items-center">
        {v.icon}
      </span>
      <span className="truncate font-medium">{message}</span>
      {secondary ? (
        <span className="truncate text-text-muted">
          <span className="px-2 text-text-faint">·</span>
          {secondary}
        </span>
      ) : null}
      <span className="ml-auto flex shrink-0 items-center">
        {action ?? <ChevronRight className="size-3.5 text-text-muted" />}
      </span>
    </div>
  )
}
