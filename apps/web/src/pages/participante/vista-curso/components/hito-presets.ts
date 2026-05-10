import type { VistaHitoEstado } from "@nexott-learn/shared-types"
import { Check, CheckCircle2, ChevronRight, Clock, Lock, XCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface HitoVisual {
  readonly icono: LucideIcon
  readonly pillClass: string
  readonly iconWrapClass: string
  readonly bloqueado: boolean
}

export function hitoVisual(estado: VistaHitoEstado): HitoVisual {
  switch (estado) {
    case "BLOQUEADO":
      return {
        icono: Lock,
        pillClass: "border-glass-border bg-surface-2 text-text-muted",
        iconWrapClass: "bg-surface-2 border-glass-border-strong text-text-muted",
        bloqueado: true,
      }
    case "DISPONIBLE":
      return {
        icono: ChevronRight,
        pillClass: "border-brand-cyan/30 bg-brand-cyan/12 text-brand-cyan",
        iconWrapClass:
          "bg-gradient-to-br from-brand-violet to-brand-cyan text-white border-transparent",
        bloqueado: false,
      }
    case "EN_REVISION":
      return {
        icono: Clock,
        pillClass: "border-warning/25 bg-warning/12 text-warning",
        iconWrapClass: "bg-warning/15 border-warning/25 text-warning",
        bloqueado: false,
      }
    case "APROBADO":
      return {
        icono: CheckCircle2,
        pillClass: "border-success/25 bg-success/12 text-success",
        iconWrapClass: "bg-success/15 border-success/30 text-success",
        bloqueado: false,
      }
    case "REPROBADO_PUEDE_REINTENTAR":
      return {
        icono: XCircle,
        pillClass: "border-danger/25 bg-danger/12 text-danger",
        iconWrapClass: "bg-danger/10 border-danger/25 text-danger",
        bloqueado: false,
      }
    case "REPROBADO_SIN_INTENTOS":
      return {
        icono: XCircle,
        pillClass: "border-danger/30 bg-danger/15 text-danger",
        iconWrapClass: "bg-danger/15 border-danger/30 text-danger",
        bloqueado: true,
      }
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}

export const ICONO_REQ_CUMPLIDO = Check
export const ICONO_REQ_PENDIENTE = XCircle
