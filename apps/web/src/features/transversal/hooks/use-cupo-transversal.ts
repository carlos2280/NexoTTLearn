import type { ApiError } from "@/shared/api/api-error"
import type { CupoIntentosTransversal } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerCupoTransversal } from "../api/intentos-transversal.api"

export const CUPO_TRANSVERSAL_KEY = ["transversal", "cupo"] as const

/**
 * Cupo de intentos del hito transversal para el participante (B1): usados / cupo
 * efectivo. Alimenta el "Te quedan N de M intentos" y el aviso "sin intentos →
 * tu admin revisará". Es una mejora, no un bloqueante: si falla, el canvas sigue
 * funcionando sin el contador (el backend igual hace cumplir el tope con 409).
 */
export function useCupoTransversal(
  asignacionId: string | null,
): UseQueryResult<CupoIntentosTransversal, ApiError> {
  return useQuery<CupoIntentosTransversal, ApiError>({
    queryKey: [...CUPO_TRANSVERSAL_KEY, asignacionId ?? ""],
    queryFn: () => obtenerCupoTransversal(asignacionId as string),
    staleTime: 30_000,
    enabled: !!asignacionId,
  })
}
