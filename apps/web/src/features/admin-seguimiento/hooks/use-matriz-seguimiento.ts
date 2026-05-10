import type { MatrizCursoResponse, SeguimientoMatrizQuery } from "@nexott-learn/shared-types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { obtenerMatrizSeguimiento } from "../api/matriz.api"

export const SEGUIMIENTO_MATRIZ_KEY = ["admin", "seguimiento", "matriz"] as const

export function matrizSeguimientoQueryKey(cursoId: string, query: Partial<SeguimientoMatrizQuery>) {
  return [...SEGUIMIENTO_MATRIZ_KEY, cursoId, query] as const
}

export function useMatrizSeguimiento(
  cursoId: string | undefined,
  query: Partial<SeguimientoMatrizQuery> = {},
) {
  return useQuery<MatrizCursoResponse>({
    queryKey: matrizSeguimientoQueryKey(cursoId ?? "", query),
    queryFn: () => obtenerMatrizSeguimiento(cursoId as string, query),
    enabled: Boolean(cursoId),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}
