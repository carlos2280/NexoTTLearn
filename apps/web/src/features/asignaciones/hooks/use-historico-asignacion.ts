import type { PaginacionQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarHistoricoEstadosAsignacion } from "../api/asignaciones.api"
import { ASIGNACIONES_QUERY_KEY } from "./use-listar-asignaciones"

export function historicoAsignacionQueryKey(asignacionId: string, query: PaginacionQuery) {
  return [...ASIGNACIONES_QUERY_KEY, "historico", asignacionId, query] as const
}

export function useHistoricoAsignacion(asignacionId: string | undefined, query: PaginacionQuery) {
  return useQuery({
    queryKey: asignacionId
      ? historicoAsignacionQueryKey(asignacionId, query)
      : ([...ASIGNACIONES_QUERY_KEY, "historico", "vacio"] as const),
    queryFn: () => listarHistoricoEstadosAsignacion(asignacionId ?? "", query),
    enabled: Boolean(asignacionId),
    placeholderData: (anterior) => anterior,
    staleTime: 30_000,
  })
}
