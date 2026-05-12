import type { ListarAsignacionesQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarAsignacionesPorCurso } from "../api/asignaciones.api"

export const ASIGNACIONES_QUERY_KEY = ["asignaciones"] as const

export function listarAsignacionesQueryKey(cursoId: string, query: ListarAsignacionesQuery) {
  return [...ASIGNACIONES_QUERY_KEY, "listar", cursoId, query] as const
}

export function useListarAsignaciones(cursoId: string | undefined, query: ListarAsignacionesQuery) {
  return useQuery({
    queryKey: cursoId
      ? listarAsignacionesQueryKey(cursoId, query)
      : ([...ASIGNACIONES_QUERY_KEY, "listar", "vacio"] as const),
    queryFn: () => listarAsignacionesPorCurso(cursoId ?? "", query),
    enabled: Boolean(cursoId),
    placeholderData: (anterior) => anterior,
    staleTime: 30_000,
  })
}
