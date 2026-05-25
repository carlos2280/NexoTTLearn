import type { ApiError } from "@/shared/api/api-error"
import type { IntentoBloqueResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerMejorIntentoBloque } from "../api/intentos-bloque.api"

export const MEJOR_INTENTO_BLOQUE_KEY = ["me", "mejor-intento-bloque"] as const

/**
 * Mejor intento vigente del colaborador en un bloque (D13, regla "mejor
 * intento gana"). Devuelve `null` si nunca intentó o si todos los intentos
 * están invalidados por edición del bloque (D81).
 *
 * Se invalida vía la mutación `useCrearIntentoBloque`.
 */
export function useMejorIntentoBloque(input: {
  readonly colaboradorId: string | undefined
  readonly bloqueId: string | undefined
}): UseQueryResult<IntentoBloqueResponse | null, ApiError> {
  return useQuery<IntentoBloqueResponse | null, ApiError>({
    queryKey: [...MEJOR_INTENTO_BLOQUE_KEY, input.colaboradorId, input.bloqueId] as const,
    queryFn: () => {
      if (!(input.colaboradorId && input.bloqueId)) {
        return Promise.resolve(null)
      }
      return obtenerMejorIntentoBloque({
        colaboradorId: input.colaboradorId,
        bloqueId: input.bloqueId,
      })
    },
    enabled: !!input.colaboradorId && !!input.bloqueId,
    staleTime: 30_000,
  })
}
