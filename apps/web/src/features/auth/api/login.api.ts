import { httpClient } from "@/shared/api/http-client"
import type { LoginInput, LoginResult } from "@nexott-learn/shared-types"

export function login(input: LoginInput): Promise<LoginResult> {
  return httpClient.post<LoginResult>("/auth/login", input)
}
