import type { ApiError } from "@/shared/api/api-error"
import type { IntentoTransversalAdminResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerIntentoTransversalAdmin } from "../api/intentos-transversal.api"

export const INTENTO_TRANSVERSAL_ADMIN_KEY = ["transversal", "intento", "admin"] as const

/**
 * `GET /intentos-transversal/:id` — proyeccion ADMIN. Devuelve el detalle
 * completo con las 3 notas por capa, motivoAnulacion y campos sensibles.
 * Lo consume la pantalla admin del intento transversal.
 */
export function useObtenerIntentoTransversalAdmin(
  intentoId: string | null,
): UseQueryResult<IntentoTransversalAdminResponse, ApiError> {
  return useQuery<IntentoTransversalAdminResponse, ApiError>({
    queryKey: [...INTENTO_TRANSVERSAL_ADMIN_KEY, intentoId ?? ""],
    queryFn: () => obtenerIntentoTransversalAdmin(intentoId as string),
    staleTime: 60_000,
    enabled: !!intentoId,
  })
}
