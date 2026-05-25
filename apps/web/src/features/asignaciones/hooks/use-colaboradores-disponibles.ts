import type { ListarColaboradoresDisponiblesQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarColaboradoresDisponibles } from "../api/asignaciones.api"

const COLABORADORES_DISPONIBLES_KEY = ["asignaciones", "colaboradores-disponibles"] as const

export function colaboradoresDisponiblesQueryKey(
  cursoId: string,
  query: ListarColaboradoresDisponiblesQuery,
) {
  return [...COLABORADORES_DISPONIBLES_KEY, cursoId, query] as const
}

export function useColaboradoresDisponibles(
  cursoId: string | undefined,
  query: ListarColaboradoresDisponiblesQuery,
  options?: { readonly habilitado?: boolean },
) {
  const habilitado = (options?.habilitado ?? true) && Boolean(cursoId)
  return useQuery({
    queryKey: cursoId
      ? colaboradoresDisponiblesQueryKey(cursoId, query)
      : ([...COLABORADORES_DISPONIBLES_KEY, "vacio"] as const),
    queryFn: () => listarColaboradoresDisponibles(cursoId ?? "", query),
    enabled: habilitado,
    placeholderData: (anterior) => anterior,
    staleTime: 30_000,
  })
}
