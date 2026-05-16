import type { ApiError } from "@/shared/api/api-error"
import type { PlanResponseParticipante } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerPlanParticipante } from "../api/obtener-plan.api"

export const PLAN_PARTICIPANTE_KEY = ["plan-personal", "participante"] as const

export function planParticipanteKey(asignacionId: string) {
  return [...PLAN_PARTICIPANTE_KEY, asignacionId] as const
}

export function usePlanParticipante(
  asignacionId: string | null,
): UseQueryResult<PlanResponseParticipante, ApiError> {
  return useQuery<PlanResponseParticipante, ApiError>({
    queryKey: planParticipanteKey(asignacionId ?? ""),
    queryFn: () => obtenerPlanParticipante(asignacionId as string),
    staleTime: 30_000,
    enabled: !!asignacionId,
  })
}
