import type { ListarLogCambiosQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarLogCambios } from "../api/cursos.api"
import { CURSOS_QUERY_KEY } from "./use-listar-cursos"

export function useListarLogCambios(
  cursoId: string | undefined,
  query: ListarLogCambiosQuery,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...CURSOS_QUERY_KEY, "log-cambios", cursoId, query] as const,
    queryFn: () => listarLogCambios(cursoId ?? "", query),
    enabled: Boolean(cursoId) && enabled,
    placeholderData: (anterior) => anterior,
    staleTime: 15_000,
  })
}
