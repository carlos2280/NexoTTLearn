import type { ApiError } from "@/shared/api/api-error"
import type { AjustarEntrevistaResponse } from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { ajustarIntentoEntrevistaIa } from "../api/intentos-entrevista-ia.api"
import { INTENTO_ENTREVISTA_IA_ADMIN_KEY } from "./use-obtener-intento-entrevista-ia-admin"

interface AjustarVars {
  readonly intentoId: string
  readonly notaAjustada: number
  readonly motivo: string
}

/**
 * Mutation admin para ajustar la nota global del intento. Tras exito invalida
 * la query del intento (refresca la vista actual) y las ramas que dependen del
 * resultado: ficha del colaborador, listados de entrevistas y centro de
 * revision admin.
 */
export function useAjustarIntentoEntrevistaIa(): UseMutationResult<
  AjustarEntrevistaResponse,
  ApiError,
  AjustarVars
> {
  const queryClient = useQueryClient()
  return useMutation<AjustarEntrevistaResponse, ApiError, AjustarVars>({
    mutationFn: (vars) => ajustarIntentoEntrevistaIa(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTENTO_ENTREVISTA_IA_ADMIN_KEY })
      queryClient.invalidateQueries({ queryKey: ["entrevista-ia"] })
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] })
    },
  })
}
