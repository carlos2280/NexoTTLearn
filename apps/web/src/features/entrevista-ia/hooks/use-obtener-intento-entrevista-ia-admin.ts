import type { ApiError } from "@/shared/api/api-error"
import type { IntentoEntrevistaIaAdminResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerIntentoEntrevistaIaAdmin } from "../api/intentos-entrevista-ia.api"

export const INTENTO_ENTREVISTA_IA_ADMIN_KEY = ["entrevista-ia", "intento", "admin"] as const

/**
 * `GET /intentos-entrevista-ia/:id` — proyeccion ADMIN. Devuelve transcripcion
 * completa, nota global, notas por area, contexto del colaborador y curso, y
 * los campos de ajuste/anulacion. Lo consume la pantalla admin del intento.
 */
export function useObtenerIntentoEntrevistaIaAdmin(
  intentoId: string | null,
): UseQueryResult<IntentoEntrevistaIaAdminResponse, ApiError> {
  return useQuery<IntentoEntrevistaIaAdminResponse, ApiError>({
    queryKey: [...INTENTO_ENTREVISTA_IA_ADMIN_KEY, intentoId ?? ""],
    queryFn: () => obtenerIntentoEntrevistaIaAdmin(intentoId as string),
    staleTime: 60_000,
    enabled: !!intentoId,
  })
}
