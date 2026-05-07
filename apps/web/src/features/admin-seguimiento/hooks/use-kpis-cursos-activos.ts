import type { KpisCursoActual } from "@nexott-learn/shared-types"
import { useQueries } from "@tanstack/react-query"
import { obtenerKpisSeguimiento } from "../api/kpis.api"
import { kpisSeguimientoQueryKey } from "./use-kpis-seguimiento"

interface KpisCursoActualEntry {
  readonly cursoId: string
  readonly data: KpisCursoActual | null
  readonly isLoading: boolean
}

// N+1 conocido: emite una query por curso activo del hub. Aceptable mientras
// el listado de cursos activos se mantenga acotado. Pendiente de endpoint
// agregado al back para el hub.
export function useKpisCursosActivos(cursoIds: readonly string[]): readonly KpisCursoActualEntry[] {
  const results = useQueries({
    queries: cursoIds.map((cursoId) => ({
      queryKey: kpisSeguimientoQueryKey(cursoId, "actual" as const),
      queryFn: () => obtenerKpisSeguimiento(cursoId, "actual" as const),
      staleTime: 30_000,
    })),
  })
  return cursoIds.map((cursoId, idx) => {
    const result = results[idx]
    const data = result?.data
    if (data && data.tab === "actual") {
      return { cursoId, data, isLoading: false }
    }
    return { cursoId, data: null, isLoading: result?.isLoading ?? false }
  })
}
