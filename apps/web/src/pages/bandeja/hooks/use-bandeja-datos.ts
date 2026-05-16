import { useFichaResumen } from "@/features/me/hooks/use-ficha-resumen"
import { useMiBandeja } from "@/features/me/hooks/use-mi-bandeja"
import { useMisCursos } from "@/features/me/hooks/use-mis-cursos"
import type {
  FichaResumenResponse,
  MeCursoResumenConSkills,
  SiguienteAccionConRevision,
} from "../types"

interface BandejaDatos {
  readonly cargando: boolean
  readonly error: Error | null
  readonly siguienteAccion: SiguienteAccionConRevision | null
  readonly cursosActivos: readonly MeCursoResumenConSkills[]
  readonly fichaResumen: FichaResumenResponse | null
}

/**
 * Orquesta las 3 queries del nuevo diseño de bandeja (pantalla 01):
 *
 *  - `useMiBandeja`     → solo se consume `siguienteAccion`. El resto del
 *                         envelope (pendientes/novedades/contadores) son
 *                         legacy de la bandeja anterior y NO se proyecta.
 *  - `useMisCursos`     → filtro `estado=ACTIVO` para el bloque 2.
 *  - `useFichaResumen`  → resumen cualitativo para el bloque 3 (B-3).
 *
 * Cargando: true si CUALQUIERA aún carga.
 * Error: el primero que falle se proyecta — la pantalla muestra el banner
 * de error en lugar de bloques rotos.
 */
export function useBandejaDatos(): BandejaDatos {
  const bandeja = useMiBandeja()
  const cursos = useMisCursos({ estado: "ACTIVO" })
  const ficha = useFichaResumen()

  const cargando = bandeja.isLoading || cursos.isLoading || ficha.isLoading
  const error = (bandeja.error ?? cursos.error ?? ficha.error ?? null) as Error | null

  return {
    cargando,
    error,
    siguienteAccion: (bandeja.data?.siguienteAccion as SiguienteAccionConRevision | null) ?? null,
    cursosActivos: (cursos.data?.data as readonly MeCursoResumenConSkills[] | undefined) ?? [],
    fichaResumen: (ficha.data as FichaResumenResponse | undefined) ?? null,
  }
}
