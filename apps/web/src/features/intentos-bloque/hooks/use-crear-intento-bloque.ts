import type { ApiError } from "@/shared/api/api-error"
import type { CrearIntentoBloqueInput, IntentoBloqueResponse } from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { crearIntentoBloque } from "../api/intentos-bloque.api"

interface CrearIntentoMutationInput {
  readonly body: CrearIntentoBloqueInput
}

/**
 * Mutación de "crear intento de bloque". Genera Idempotency-Key v4 por
 * llamada (`crypto.randomUUID`), invalida queries derivadas al éxito:
 *
 *  - Mejor intento del bloque para refrescar la cabecera del bloque evaluable.
 *  - Avance del curso (la nota puede subir el % y los chips de skill).
 *  - Plan del participante (si la nota cruza el umbral del bloque, la sección
 *    se marca como completada y eso recalcula `bloquesCompletados`).
 *  - Bandeja (porque `siguienteAccion` puede mover de TRANSVERSAL_DISPONIBLE
 *    al desbloquear, o de CONTINUAR_CURSO al alcanzar el 100% del plan).
 */
export function useCrearIntentoBloque(): UseMutationResult<
  IntentoBloqueResponse,
  ApiError,
  CrearIntentoMutationInput
> {
  const queryClient = useQueryClient()
  return useMutation<IntentoBloqueResponse, ApiError, CrearIntentoMutationInput>({
    mutationFn: ({ body }) => crearIntentoBloque(body, crypto.randomUUID()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] })
      queryClient.invalidateQueries({ queryKey: ["asignaciones"] })
    },
  })
}
