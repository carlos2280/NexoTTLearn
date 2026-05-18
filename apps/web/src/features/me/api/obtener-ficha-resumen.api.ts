import { httpClient } from "@/shared/api/http-client"
import type { FichaResumenResponse } from "@nexott-learn/shared-types"

/**
 * `GET /api/v1/me/ficha/resumen` (B-3). Agregado cualitativo de la ficha
 * para el widget "Tu camino" de la bandeja. Cero numeros crudos en el
 * cliente — el server decide el criterio.
 */
export function obtenerFichaResumen(): Promise<FichaResumenResponse> {
  return httpClient.get<FichaResumenResponse>("/me/ficha/resumen")
}
