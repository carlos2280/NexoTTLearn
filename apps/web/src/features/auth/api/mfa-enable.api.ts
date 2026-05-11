import { httpClient } from "@/shared/api/http-client"
import type { MfaEnableInput } from "@nexott-learn/shared-types"

export function habilitarMfa(input: MfaEnableInput): Promise<void> {
  return httpClient.post<void>("/auth/mfa/enable", input)
}
