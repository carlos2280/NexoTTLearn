import type { ApiError } from "@/shared/api/api-error"
import type { CrearIntentoEntrevistaIaResponse } from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { crearIntentoEntrevistaIa } from "../api/intentos-entrevista-ia.api"
import { DISPONIBILIDAD_ENTREVISTA_IA_KEY } from "./use-disponibilidad-entrevista-ia"

export function useCrearIntentoEntrevistaIa(): UseMutationResult<
  CrearIntentoEntrevistaIaResponse,
  ApiError,
  { readonly asignacionId: string }
> {
  const queryClient = useQueryClient()
  return useMutation<CrearIntentoEntrevistaIaResponse, ApiError, { readonly asignacionId: string }>(
    {
      mutationFn: (vars) => crearIntentoEntrevistaIa(vars.asignacionId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: DISPONIBILIDAD_ENTREVISTA_IA_KEY })
      },
    },
  )
}
