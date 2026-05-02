import { httpClient } from "@/shared/api/http-client"
import type { VerifyMfaInput, VerifyMfaResponse } from "@nexott-learn/shared-types"

export function verifyMfa(input: VerifyMfaInput): Promise<VerifyMfaResponse> {
  return httpClient.post<VerifyMfaResponse>("/auth/verify-mfa", input)
}
