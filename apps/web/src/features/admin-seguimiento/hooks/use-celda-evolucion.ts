import type { CeldaEvolucionResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerCeldaEvolucion } from "../api/celda-evolucion.api"

export const CELDA_EVOLUCION_KEY = ["admin", "seguimiento", "celda", "evolucion"] as const

export function celdaEvolucionQueryKey(cursoId: string, inscripcionId: string, areaId: string) {
  return [...CELDA_EVOLUCION_KEY, cursoId, inscripcionId, areaId] as const
}

interface UseCeldaEvolucionParams {
  readonly cursoId: string | undefined
  readonly inscripcionId: string | undefined
  readonly areaId: string | undefined
}

export function useCeldaEvolucion({ cursoId, inscripcionId, areaId }: UseCeldaEvolucionParams) {
  return useQuery<CeldaEvolucionResponse>({
    queryKey: celdaEvolucionQueryKey(cursoId ?? "", inscripcionId ?? "", areaId ?? ""),
    queryFn: () =>
      obtenerCeldaEvolucion(cursoId as string, inscripcionId as string, areaId as string),
    enabled: Boolean(cursoId && inscripcionId && areaId),
    staleTime: 30_000,
  })
}
