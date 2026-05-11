import { httpClient } from "@/shared/api/http-client"

export function cerrarOtrasSesiones(): Promise<void> {
  return httpClient.delete<void>("/auth/sesiones-otras")
}
