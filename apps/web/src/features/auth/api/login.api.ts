import { httpClient } from "@/shared/api/http-client"
import type { LoginInput, LoginResponse } from "../types"

export function login(input: LoginInput): Promise<LoginResponse> {
  return httpClient.post<LoginResponse>("/auth/login", input)
}
