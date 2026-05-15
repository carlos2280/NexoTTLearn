import { httpClient } from "@/shared/api/http-client"
import type { MeBandejaResponse } from "@nexott-learn/shared-types"

export function obtenerMiBandeja(): Promise<MeBandejaResponse> {
  return httpClient.get<MeBandejaResponse>("/me/bandeja")
}
