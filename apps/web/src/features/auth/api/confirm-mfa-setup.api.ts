import { httpClient } from "@/shared/api/http-client"
import type { ConfirmMfaSetupInput, ConfirmMfaSetupResponse } from "@nexott-learn/shared-types"

export function confirmMfaSetup(input: ConfirmMfaSetupInput): Promise<ConfirmMfaSetupResponse> {
  return httpClient.post<ConfirmMfaSetupResponse>("/auth/confirm-mfa-setup", input)
}
