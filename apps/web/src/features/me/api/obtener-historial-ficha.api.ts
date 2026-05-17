import { httpClient } from "@/shared/api/http-client"
import type { EventoHistorialFicha } from "@nexott-learn/shared-types"

/**
 * Limite pedido al backend (B-24). El componente de UI muestra los primeros
 * 5 y pagina en memoria de 5 en 5; 100 cubre el peor caso visible sin
 * forzar paginacion cursor real (que aun no esta implementada).
 */
const LIMITE_HISTORIAL = 100

export function obtenerHistorialFicha(): Promise<readonly EventoHistorialFicha[]> {
  return httpClient.get<readonly EventoHistorialFicha[]>(
    `/me/ficha/historial?limite=${LIMITE_HISTORIAL}`,
  )
}
