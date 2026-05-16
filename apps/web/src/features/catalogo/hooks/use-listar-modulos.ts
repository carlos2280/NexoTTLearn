import type { ListarModulosQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarModulos } from "../api/modulos.api"

export const MODULOS_QUERY_KEY = ["catalogo", "modulos"] as const

export function useListarModulos(query: ListarModulosQuery) {
  return useQuery({
    queryKey: [...MODULOS_QUERY_KEY, "listar", query] as const,
    queryFn: () => listarModulos(query),
    placeholderData: (anterior) => anterior,
    staleTime: 30_000,
  })
}
