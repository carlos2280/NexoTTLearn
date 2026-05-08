import type { CohorteAreasResponse } from "@nexott-learn/shared-types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { obtenerCohorteAreas } from "../api/cohorte.api"

export const COHORTE_AREAS_KEY = ["admin", "seguimiento", "cohorte", "areas"] as const

export function cohorteAreasQueryKey(cursoId: string) {
  return [...COHORTE_AREAS_KEY, cursoId] as const
}

export function useCohorteAreas(cursoId: string | undefined) {
  return useQuery<CohorteAreasResponse>({
    queryKey: cohorteAreasQueryKey(cursoId ?? ""),
    queryFn: () => obtenerCohorteAreas(cursoId as string),
    enabled: Boolean(cursoId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
