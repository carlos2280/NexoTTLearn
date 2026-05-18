import type { ApiError } from "@/shared/api/api-error"
import type { EnviarTurnoInput, EnviarTurnoResponse } from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import { enviarTurno } from "../api/intentos-entrevista-ia.api"

interface EnviarTurnoArgs {
  readonly intentoId: string
  readonly body: EnviarTurnoInput
}

export function useEnviarTurnoEntrevistaIa(): UseMutationResult<
  EnviarTurnoResponse,
  ApiError,
  EnviarTurnoArgs
> {
  return useMutation<EnviarTurnoResponse, ApiError, EnviarTurnoArgs>({
    mutationFn: enviarTurno,
  })
}
