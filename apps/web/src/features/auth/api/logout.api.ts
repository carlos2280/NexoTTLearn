import { httpClient } from "@/shared/api/http-client"

export function logout(): Promise<void> {
  return httpClient.delete<void>("/auth/session")
}
