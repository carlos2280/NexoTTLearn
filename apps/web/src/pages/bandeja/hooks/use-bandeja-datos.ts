import { useCursosDisponiblesVoluntario } from "@/features/cursos/hooks/use-cursos-disponibles-voluntario"
import { useMisCursos } from "@/features/me/hooks/use-mis-cursos"
import { useNotificacionesNoLeidas } from "@/features/notificaciones/hooks/use-notificaciones-no-leidas"
import type { MeCursoResumen } from "@nexott-learn/shared-types"

interface BandejaDatos {
  readonly cargando: boolean
  readonly error: Error | null
  readonly cursos: readonly MeCursoResumen[]
  readonly siguientePaso: MeCursoResumen | null
  readonly novedades: ReturnType<typeof useNotificacionesNoLeidas>["data"]
  readonly totalNoLeidas: number
  readonly totalCursosVoluntariado: number
}

/**
 * Compone las queries de la bandeja en cliente (PR 2).
 *
 * Cuando llegue GET /me/bandeja (D-BANDEJA-1) este hook se reduce a una sola
 * query y la lógica de "siguienteAccion" se elimina del cliente.
 */
export function useBandejaDatos(): BandejaDatos {
  const cursos = useMisCursos({ estado: "ACTIVO", pageSize: 10 })
  const novedades = useNotificacionesNoLeidas(5)
  const voluntariado = useCursosDisponiblesVoluntario()

  const listaCursos = cursos.data?.data ?? []
  const siguientePaso = elegirSiguientePaso(listaCursos)

  return {
    cargando: cursos.isLoading || novedades.isLoading || voluntariado.isLoading,
    error: (cursos.error ?? novedades.error ?? voluntariado.error) as Error | null,
    cursos: listaCursos,
    siguientePaso,
    novedades: novedades.data,
    totalNoLeidas: novedades.data?.meta.total ?? 0,
    totalCursosVoluntariado: voluntariado.data?.meta.total ?? 0,
  }
}

/**
 * Heurística temporal (sólo casos 7 y 8 del doc §4.2):
 *  - prioriza cursos ASIGNADO con deadline más cercano
 *  - fallback al primer VOLUNTARIO en progreso
 *  - null si no hay nada
 */
function elegirSiguientePaso(cursos: readonly MeCursoResumen[]): MeCursoResumen | null {
  if (cursos.length === 0) {
    return null
  }
  const asignados = cursos
    .filter((c) => c.rol === "ASIGNADO" && c.porcentajeAvance < 100)
    .slice()
    .sort((a, b) => a.fechaDeadline.localeCompare(b.fechaDeadline))
  if (asignados[0]) {
    return asignados[0]
  }
  const voluntarios = cursos.filter((c) => c.rol === "VOLUNTARIO" && c.porcentajeAvance < 100)
  return voluntarios[0] ?? null
}
