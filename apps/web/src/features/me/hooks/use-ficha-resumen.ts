import type { ApiError } from "@/shared/api/api-error"
import type { FichaResumenResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerFichaResumen } from "../api/obtener-ficha-resumen.api"

export const FICHA_RESUMEN_KEY = ["me", "ficha", "resumen"] as const

/**
 * `GET /me/ficha/resumen` (B-3). Datos del widget "Tu camino" de la bandeja:
 * total de áreas con actividad + top 3 áreas con nivel cualitativo + última
 * skill demostrada (opcional).
 *
 * `staleTime` largo (5 min) porque el resumen cambia poco — la ficha se
 * actualiza al completar secciones, evento explícito que invalida la key.
 */
export function useFichaResumen(): UseQueryResult<FichaResumenResponse, ApiError> {
  return useQuery<FichaResumenResponse, ApiError>({
    queryKey: FICHA_RESUMEN_KEY,
    queryFn: obtenerFichaResumen,
    staleTime: 5 * 60_000,
  })
}
