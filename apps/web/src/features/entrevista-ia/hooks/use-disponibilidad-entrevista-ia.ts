import type { ApiError } from "@/shared/api/api-error"
import type { DisponibilidadEntrevistaIaResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerDisponibilidadEntrevistaIa } from "../api/disponibilidad.api"

export const DISPONIBILIDAD_ENTREVISTA_IA_KEY = ["entrevista-ia", "disponibilidad"] as const

export function useDisponibilidadEntrevistaIa(
  asignacionId: string | null,
): UseQueryResult<DisponibilidadEntrevistaIaResponse, ApiError> {
  return useQuery<DisponibilidadEntrevistaIaResponse, ApiError>({
    queryKey: [...DISPONIBILIDAD_ENTREVISTA_IA_KEY, asignacionId ?? ""],
    queryFn: () => obtenerDisponibilidadEntrevistaIa(asignacionId as string),
    staleTime: 60_000,
    enabled: !!asignacionId,
  })
}
