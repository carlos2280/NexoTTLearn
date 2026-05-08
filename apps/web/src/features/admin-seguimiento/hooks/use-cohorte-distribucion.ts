import type { CohorteDistribucionResponse } from "@nexott-learn/shared-types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { obtenerCohorteDistribucion } from "../api/cohorte.api"

export const COHORTE_DISTRIBUCION_KEY = ["admin", "seguimiento", "cohorte", "distribucion"] as const

export function cohorteDistribucionQueryKey(cursoId: string) {
  return [...COHORTE_DISTRIBUCION_KEY, cursoId] as const
}

export function useCohorteDistribucion(cursoId: string | undefined) {
  return useQuery<CohorteDistribucionResponse>({
    queryKey: cohorteDistribucionQueryKey(cursoId ?? ""),
    queryFn: () => obtenerCohorteDistribucion(cursoId as string),
    enabled: Boolean(cursoId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
