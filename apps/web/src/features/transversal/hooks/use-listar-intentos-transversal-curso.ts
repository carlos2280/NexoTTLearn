import type { ApiError } from "@/shared/api/api-error"
import type {
  IntentoTransversalListadoItem,
  ListarIntentosTransversalCursoQuery,
  Paginated,
} from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { listarIntentosTransversalPorCurso } from "../api/intentos-transversal-curso.api"

export const INTENTOS_TRANSVERSAL_CURSO_KEY = ["transversal", "listado-curso"] as const

/**
 * Query admin del listado paginado de intentos transversales del curso. La
 * key incluye `cursoId` y la `query` para que cambios de filtro o paginacion
 * generen entradas distintas (refetch automatico).
 */
export function useListarIntentosTransversalPorCurso(
  cursoId: string | null,
  query: ListarIntentosTransversalCursoQuery,
): UseQueryResult<Paginated<IntentoTransversalListadoItem>, ApiError> {
  return useQuery<Paginated<IntentoTransversalListadoItem>, ApiError>({
    queryKey: [...INTENTOS_TRANSVERSAL_CURSO_KEY, cursoId ?? "", query],
    queryFn: () => listarIntentosTransversalPorCurso({ cursoId: cursoId as string, query }),
    staleTime: 30_000,
    enabled: !!cursoId,
  })
}
