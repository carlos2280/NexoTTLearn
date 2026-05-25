import type { ApiError } from "@/shared/api/api-error"
import type { DisponibilidadTransversalResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerDisponibilidadTransversal } from "../api/disponibilidad.api"

export const DISPONIBILIDAD_TRANSVERSAL_KEY = ["transversal", "disponibilidad"] as const

export function useDisponibilidadTransversal(
  asignacionId: string | null,
): UseQueryResult<DisponibilidadTransversalResponse, ApiError> {
  return useQuery<DisponibilidadTransversalResponse, ApiError>({
    queryKey: [...DISPONIBILIDAD_TRANSVERSAL_KEY, asignacionId ?? ""],
    queryFn: () => obtenerDisponibilidadTransversal(asignacionId as string),
    staleTime: 60_000,
    enabled: !!asignacionId,
  })
}
