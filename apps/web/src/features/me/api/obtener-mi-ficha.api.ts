import { httpClient } from "@/shared/api/http-client"
import type { FichaResponse } from "@nexott-learn/shared-types"

export function obtenerMiFicha(): Promise<FichaResponse> {
  return httpClient.get<FichaResponse>("/me/ficha")
}
