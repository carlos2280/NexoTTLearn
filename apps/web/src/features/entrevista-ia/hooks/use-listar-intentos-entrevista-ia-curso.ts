import type { ApiError } from "@/shared/api/api-error"
import type {
  IntentoEntrevistaIaListadoItem,
  ListarIntentosEntrevistaIaCursoQuery,
  Paginated,
} from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { listarIntentosEntrevistaIaPorCurso } from "../api/intentos-entrevista-ia-curso.api"

export const INTENTOS_ENTREVISTA_IA_CURSO_KEY = ["entrevista-ia", "listado-curso"] as const

/**
 * Query admin del listado paginado de intentos de Entrevista IA del curso. La
 * key incluye `cursoId` y la `query` serializada para que cambios de filtro o
 * paginacion generen entradas de cache distintas (refetch automatico al
 * navegar entre paginas).
 */
export function useListarIntentosEntrevistaIaPorCurso(
  cursoId: string | null,
  query: ListarIntentosEntrevistaIaCursoQuery,
): UseQueryResult<Paginated<IntentoEntrevistaIaListadoItem>, ApiError> {
  return useQuery<Paginated<IntentoEntrevistaIaListadoItem>, ApiError>({
    queryKey: [...INTENTOS_ENTREVISTA_IA_CURSO_KEY, cursoId ?? "", query],
    queryFn: () => listarIntentosEntrevistaIaPorCurso({ cursoId: cursoId as string, query }),
    staleTime: 30_000,
    enabled: !!cursoId,
  })
}
