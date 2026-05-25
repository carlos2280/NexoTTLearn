import type { NotificacionResumen } from "@nexott-learn/shared-types"

export type GrupoTemporal = "hoy" | "estaSemana" | "anterior"

export const ETIQUETA_GRUPO: Record<GrupoTemporal, string> = {
  hoy: "Hoy",
  estaSemana: "Esta semana",
  anterior: "Anterior",
}

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Bucket temporal segun cuanto hace que llego la notificacion. La spec
 * decide tres grupos: hoy / esta semana / anterior — sin "ayer" para
 * mantener simplicidad.
 */
function bucket(fechaISO: string): GrupoTemporal {
  const t = new Date(fechaISO).getTime()
  if (Number.isNaN(t)) {
    return "anterior"
  }
  const diff = Date.now() - t
  if (diff < DIA_MS) {
    return "hoy"
  }
  if (diff < 7 * DIA_MS) {
    return "estaSemana"
  }
  return "anterior"
}

export interface GrupoNotificaciones {
  readonly grupo: GrupoTemporal
  readonly items: readonly NotificacionResumen[]
}

/**
 * Agrupa la lista paginada en buckets temporales, manteniendo el orden
 * cronologico inverso dentro de cada grupo. Solo devuelve grupos con items.
 */
export function agruparTemporal(
  notificaciones: readonly NotificacionResumen[],
): readonly GrupoNotificaciones[] {
  const buckets: Record<GrupoTemporal, NotificacionResumen[]> = {
    hoy: [],
    estaSemana: [],
    anterior: [],
  }
  for (const n of notificaciones) {
    buckets[bucket(n.fechaCreacion)].push(n)
  }
  const orden: readonly GrupoTemporal[] = ["hoy", "estaSemana", "anterior"]
  return orden.map((grupo) => ({ grupo, items: buckets[grupo] })).filter((g) => g.items.length > 0)
}
