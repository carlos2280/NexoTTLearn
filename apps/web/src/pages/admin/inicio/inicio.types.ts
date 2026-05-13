import type { LucideIcon } from "lucide-react"

export type TonoKpi = "acento" | "success" | "warning" | "danger"

export interface KpiPulso {
  readonly id: string
  readonly etiqueta: string
  readonly valor: number
  readonly sufijo?: string
  readonly tono: TonoKpi
  readonly icono: LucideIcon
  readonly nota: string
  /** Variación respecto al periodo anterior. Solo se renderiza si hay histórico real. */
  readonly delta?: number
  /** Serie temporal para el sparkline. Solo se renderiza si tiene ≥ 2 puntos. */
  readonly serie?: readonly number[]
}

export type PrioridadCaso = "urgente" | "alta" | "normal"

export interface CasoRevision {
  readonly id: string
  readonly titulo: string
  readonly contexto: string
  readonly prioridad: PrioridadCaso
  readonly slaRestante: string
  readonly responsable: string
}

export type TipoEvento = "publicacion" | "matricula" | "evaluacion" | "sistema" | "alerta"

export interface EventoPulso {
  readonly id: string
  readonly tipo: TipoEvento
  readonly actor: string
  readonly accion: string
  readonly objeto: string
  readonly hace: string
}
