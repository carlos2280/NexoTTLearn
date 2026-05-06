import type { ObtenerAreasCompetenciaResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerAreasCompetencia } from "../api/obtener-areas-competencia.api"

// Catalogo solo-lectura. Las areas cambian poco; staleTime largo para no
// pegarle a la red cada vez que se abre el drawer de modulo.
export const ADMIN_AREAS_COMPETENCIA_KEY = ["admin", "areas-competencia"] as const

export function useAreasCompetencia() {
  return useQuery<ObtenerAreasCompetenciaResponse>({
    queryKey: ADMIN_AREAS_COMPETENCIA_KEY,
    queryFn: obtenerAreasCompetencia,
    staleTime: 5 * 60_000,
  })
}
