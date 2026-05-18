import { useMemo } from "react"
import type { FiltroAprobadoUi, FiltroEstadoUi } from "./filtros-evaluaciones.types"

interface ConAprobado {
  readonly aprobado: boolean | null
  readonly anulado: boolean
}

/**
 * Filtro client-side por estado de aprobacion. El backend solo expone el filtro
 * `estado` (EN_PROGRESO, FINALIZADO, etc.); `aprobado` se deriva de
 * `aprobado: boolean | null` y `anulado: boolean`, por eso se aplica aqui.
 *
 * Limitacion: este filtro corre sobre la pagina actual ya cargada, no sobre el
 * total de la base. Para v1 es aceptable; cuando la BD crezca se puede mover
 * al backend como nuevo parametro de query.
 */
export function aplicarFiltroAprobado<T extends ConAprobado>(
  items: readonly T[],
  aprobado: FiltroAprobadoUi,
): readonly T[] {
  if (aprobado === "TODOS") {
    return items
  }
  if (aprobado === "SI") {
    return items.filter((i) => i.aprobado === true && !i.anulado)
  }
  if (aprobado === "NO") {
    return items.filter((i) => i.aprobado === false && !i.anulado)
  }
  // PENDIENTE
  return items.filter((i) => i.aprobado === null && !i.anulado)
}

/**
 * Traduce el filtro UI a un valor valido del enum del backend, o `undefined`
 * para "TODOS". El generico `<T extends string>` permite reutilizarlo con
 * ambos enums (EntrevistaIa y Transversal) sin perder tipado.
 */
export function mapearEstadoAQuery<T extends string>(
  estado: FiltroEstadoUi,
  validos: readonly T[],
): T | undefined {
  if (estado === "TODOS") {
    return undefined
  }
  return validos.includes(estado as T) ? (estado as T) : undefined
}

/**
 * Formateador de fecha estable y memoizado. Vive en hook para que el
 * `Intl.DateTimeFormat` se construya una sola vez por instancia del componente.
 */
export function useFormatearFecha(): (iso: string) => string {
  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CL", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  )
  return (iso: string) => fmt.format(new Date(iso))
}
