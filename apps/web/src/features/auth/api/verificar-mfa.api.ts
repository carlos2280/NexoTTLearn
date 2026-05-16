import { httpClient } from "@/shared/api/http-client"
import type { VerificarMfaInput } from "../types"

export function verificarMfa(input: VerificarMfaInput): Promise<void> {
  return httpClient.post<void>("/auth/mfa/verify", input)
}
