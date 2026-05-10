import type { EstadoCurso } from "@nexott-learn/shared-types"

const FORMATTER = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" })

export function formatDeadline(iso: string | null): {
  readonly label: string
  readonly tone: "neutral" | "warning" | "danger"
  readonly daysLeft: number | null
} {
  if (!iso) {
    return { label: "Sin deadline", tone: "neutral", daysLeft: null }
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return { label: "Sin deadline", tone: "neutral", daysLeft: null }
  }
  const now = new Date()
  const diff = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) {
    return { label: `Vencido ${FORMATTER.format(date)}`, tone: "danger", daysLeft: diff }
  }
  if (diff === 0) {
    return { label: "Vence hoy", tone: "danger", daysLeft: 0 }
  }
  if (diff <= 7) {
    return { label: `Quedan ${diff}d`, tone: "danger", daysLeft: diff }
  }
  if (diff <= 14) {
    return { label: `Quedan ${diff}d`, tone: "warning", daysLeft: diff }
  }
  return { label: FORMATTER.format(date), tone: "neutral", daysLeft: diff }
}

export function formatDate(iso: string | null): string {
  if (!iso) {
    return "—"
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return FORMATTER.format(date)
}

interface EstadoMeta {
  readonly label: string
  readonly tone: "neutral" | "violet" | "success"
}

export const ESTADO_META: Record<EstadoCurso, EstadoMeta> = {
  // biome-ignore lint/style/useNamingConvention: replica EstadoCurso del schema
  BORRADOR: { label: "Borrador", tone: "neutral" },
  // biome-ignore lint/style/useNamingConvention: replica EstadoCurso del schema
  ACTIVO: { label: "Activo", tone: "violet" },
  // biome-ignore lint/style/useNamingConvention: replica EstadoCurso del schema
  CERRADO: { label: "Cerrado", tone: "success" },
}
