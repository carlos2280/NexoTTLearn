import { httpClient } from "@/shared/api/http-client"
import type { MfaSetupResponse } from "@nexott-learn/shared-types"

export function iniciarMfaSetup(): Promise<MfaSetupResponse> {
  return httpClient.post<MfaSetupResponse>("/auth/mfa/setup")
}
