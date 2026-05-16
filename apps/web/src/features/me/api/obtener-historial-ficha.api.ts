import { httpClient } from "@/shared/api/http-client"
import type { EventoHistorialFicha } from "@nexott-learn/shared-types"

export function obtenerHistorialFicha(): Promise<readonly EventoHistorialFicha[]> {
  return httpClient.get<readonly EventoHistorialFicha[]>("/me/ficha/historial")
}
