import type { CohorteSerieResponse } from "@nexott-learn/shared-types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { obtenerCohorteSerie } from "../api/cohorte.api"

export const COHORTE_SERIE_KEY = ["admin", "seguimiento", "cohorte", "serie"] as const

export function cohorteSerieQueryKey(cursoId: string) {
  return [...COHORTE_SERIE_KEY, cursoId] as const
}

export function useCohorteSerie(cursoId: string | undefined) {
  return useQuery<CohorteSerieResponse>({
    queryKey: cohorteSerieQueryKey(cursoId ?? ""),
    queryFn: () => obtenerCohorteSerie(cursoId as string),
    enabled: Boolean(cursoId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
