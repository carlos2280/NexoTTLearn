import type { ApiError } from "@/shared/api/api-error"
import type { IntentoEntrevistaIaParticipanteResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerIntentoEntrevistaIa } from "../api/intentos-entrevista-ia.api"

export const INTENTO_ENTREVISTA_IA_KEY = ["entrevista-ia", "intento"] as const

/**
 * `GET /intentos-entrevista-ia/:id` — detalle del intento con la transcripcion
 * completa y el veredicto (`aprobado`, `notaGlobal`). El chat lo consume tras
 * recibir `finalizado=true` para mostrar la vista de cierre correcta sin
 * adivinar el resultado en el cliente.
 */
export function useObtenerIntentoEntrevistaIa(
  intentoId: string | null,
  opciones?: { readonly enabled?: boolean },
): UseQueryResult<IntentoEntrevistaIaParticipanteResponse, ApiError> {
  return useQuery<IntentoEntrevistaIaParticipanteResponse, ApiError>({
    queryKey: [...INTENTO_ENTREVISTA_IA_KEY, intentoId ?? ""],
    queryFn: () => obtenerIntentoEntrevistaIa(intentoId as string),
    staleTime: 5 * 60_000,
    enabled: !!intentoId && (opciones?.enabled ?? true),
  })
}
