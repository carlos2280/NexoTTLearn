import { httpClient } from "@/shared/api/http-client"
import type { CambiarPasswordInput } from "@nexott-learn/shared-types"

export function cambiarPassword(input: CambiarPasswordInput): Promise<void> {
  return httpClient.post<void>("/auth/cambiar-password", input)
}
