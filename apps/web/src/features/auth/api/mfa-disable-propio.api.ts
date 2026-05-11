import { httpClient } from "@/shared/api/http-client"

export function desactivarMfaPropio(codigo: string, motivo: string): Promise<void> {
  return httpClient.delete<void>("/auth/mfa", { body: { codigo }, motivo })
}
