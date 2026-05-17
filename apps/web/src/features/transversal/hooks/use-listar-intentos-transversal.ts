import type { ApiError } from "@/shared/api/api-error"
import type { IntentoTransversalParticipanteResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { listarIntentosTransversal } from "../api/intentos-transversal.api"

export const INTENTOS_TRANSVERSAL_KEY = ["transversal", "intentos"] as const

export function useListarIntentosTransversal(
  asignacionId: string | null,
): UseQueryResult<readonly IntentoTransversalParticipanteResponse[], ApiError> {
  return useQuery<readonly IntentoTransversalParticipanteResponse[], ApiError>({
    queryKey: [...INTENTOS_TRANSVERSAL_KEY, asignacionId ?? ""],
    queryFn: () => listarIntentosTransversal(asignacionId as string),
    staleTime: 30_000,
    enabled: !!asignacionId,
  })
}
