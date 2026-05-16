import type { TipoAlerta } from "@nexott-learn/shared-types"
import { AlertOctagon, CalendarOff, type LucideIcon, RefreshCw, ShieldAlert } from "lucide-react"

export type VistaAvance = "ACTUAL" | "FOTOGRAFIA_CIERRE" | "HISTORICO"

export interface CursoOpcion {
  readonly id: string
  readonly titulo: string
}

export interface EstadoDefinicion {
  /** Enum literal del backend (FilaAvanceCurso.estado). */
  readonly id: string
  readonly etiqueta: string
  readonly tokenSoft: string
  readonly tokenOnSoft: string
  readonly tokenColor: string
}

const ESTADOS: readonly EstadoDefinicion[] = [
  {
    id: "ASIGNADO",
    etiqueta: "Asignado",
    tokenSoft: "var(--color-state-pendiente-soft)",
    tokenOnSoft: "var(--color-state-pendiente-on-soft)",
    tokenColor: "var(--color-state-pendiente)",
  },
  {
    id: "EN_PROGRESO",
    etiqueta: "En progreso",
    tokenSoft: "var(--color-state-progreso-soft)",
    tokenOnSoft: "var(--color-state-progreso-on-soft)",
    tokenColor: "var(--color-state-progreso)",
  },
  {
    id: "APTO",
    etiqueta: "Apto",
    tokenSoft: "var(--color-state-apto-soft)",
    tokenOnSoft: "var(--color-state-apto-on-soft)",
    tokenColor: "var(--color-state-apto)",
  },
  {
    id: "NO_APTO",
    etiqueta: "No apto",
    tokenSoft: "var(--color-state-no-apto-soft)",
    tokenOnSoft: "var(--color-state-no-apto-on-soft)",
    tokenColor: "var(--color-state-no-apto)",
  },
]

export function obtenerEstado(id: string): EstadoDefinicion | undefined {
  return ESTADOS.find((e) => e.id === id)
}

export interface AlertaDefinicion {
  readonly id: TipoAlerta
  readonly etiqueta: string
  readonly icono: LucideIcon
  readonly tono: "warning" | "danger"
}

const ALERTAS: readonly AlertaDefinicion[] = [
  {
    id: "SIN_ACTIVIDAD_7_DIAS",
    etiqueta: "Sin actividad ≥ 7 días",
    icono: CalendarOff,
    tono: "warning",
  },
  {
    id: "PLAN_NO_CALCULADO",
    etiqueta: "Plan no calculado",
    icono: ShieldAlert,
    tono: "danger",
  },
  {
    id: "PLAN_DESACTUALIZADO",
    etiqueta: "Plan desactualizado",
    icono: RefreshCw,
    tono: "warning",
  },
  {
    id: "INTENTO_INVALIDADO_RECIENTE",
    etiqueta: "Intento invalidado reciente",
    icono: AlertOctagon,
    tono: "danger",
  },
]

export function obtenerAlerta(id: TipoAlerta): AlertaDefinicion | undefined {
  return ALERTAS.find((a) => a.id === id)
}
