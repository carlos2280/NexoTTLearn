import { httpClient } from "@/shared/api/http-client"
import type { MfaVerifyResponse } from "@nexott-learn/shared-types"
import type { VerificarMfaInput } from "../types"

export function verificarMfa(input: VerificarMfaInput): Promise<MfaVerifyResponse> {
  return httpClient.post<MfaVerifyResponse>("/auth/mfa/verify", input)
}
