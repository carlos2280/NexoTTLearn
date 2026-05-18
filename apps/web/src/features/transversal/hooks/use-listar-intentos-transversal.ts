import type { ApiError } from "@/shared/api/api-error"
import type { IntentoTransversalParticipanteResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { listarIntentosTransversal } from "../api/intentos-transversal.api"

export const INTENTOS_TRANSVERSAL_KEY = ["transversal", "intentos"] as const

const POLLING_MS = 10_000

interface UseListarIntentosTransversalOptions {
  /**
   * Activa polling cada 10s mientras la pestaña está visible. La pantalla 05
   * vista 2 (en evaluación) lo enciende solo si hay un intento EN_EVALUACION;
   * cuando finaliza, el orquestador desactiva el polling.
   */
  readonly pollingActivo?: boolean
}

export function useListarIntentosTransversal(
  asignacionId: string | null,
  options: UseListarIntentosTransversalOptions = {},
): UseQueryResult<readonly IntentoTransversalParticipanteResponse[], ApiError> {
  return useQuery<readonly IntentoTransversalParticipanteResponse[], ApiError>({
    queryKey: [...INTENTOS_TRANSVERSAL_KEY, asignacionId ?? ""],
    queryFn: () => listarIntentosTransversal(asignacionId as string),
    staleTime: 30_000,
    enabled: !!asignacionId,
    refetchInterval: options.pollingActivo ? POLLING_MS : false,
    refetchIntervalInBackground: false,
  })
}
