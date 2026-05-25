import type { ApiError } from "@/shared/api/api-error"
import type { AnularEntrevistaResponse } from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { anularIntentoEntrevistaIa } from "../api/intentos-entrevista-ia.api"
import { INTENTO_ENTREVISTA_IA_ADMIN_KEY } from "./use-obtener-intento-entrevista-ia-admin"

interface AnularVars {
  readonly intentoId: string
  readonly motivo: string
}

/**
 * Mutation admin para anular un intento. La api genera la `Idempotency-Key`
 * internamente — un doble click no anula dos veces, el backend reconoce la
 * key y devuelve el resultado cacheado.
 */
export function useAnularIntentoEntrevistaIa(): UseMutationResult<
  AnularEntrevistaResponse,
  ApiError,
  AnularVars
> {
  const queryClient = useQueryClient()
  return useMutation<AnularEntrevistaResponse, ApiError, AnularVars>({
    mutationFn: (vars) => anularIntentoEntrevistaIa(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTENTO_ENTREVISTA_IA_ADMIN_KEY })
      queryClient.invalidateQueries({ queryKey: ["entrevista-ia"] })
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] })
    },
  })
}
