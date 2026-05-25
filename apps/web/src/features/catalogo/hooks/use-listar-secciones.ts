import type { ListarSeccionesQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarSecciones } from "../api/secciones.api"

export const SECCIONES_QUERY_KEY = ["catalogo", "secciones"] as const

export function useListarSecciones(query: ListarSeccionesQuery) {
  return useQuery({
    queryKey: [...SECCIONES_QUERY_KEY, "listar", query] as const,
    queryFn: () => listarSecciones(query),
    placeholderData: (anterior) => anterior,
    staleTime: 15_000,
  })
}
