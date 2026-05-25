import { httpClient } from "@/shared/api/http-client"
import type { UsuarioSesion } from "../types"

export function obtenerUsuarioActual(): Promise<UsuarioSesion> {
  return httpClient.get<UsuarioSesion>("/auth/me")
}
