import { ApiError } from "@/shared/api/api-error"
import { httpClient } from "@/shared/api/http-client"
import type { UsuarioPublico } from "@nexott-learn/shared-types"

// Devuelve null si no hay sesion (401 esperado), propaga otros errores.
export async function obtenerUsuarioActual(): Promise<UsuarioPublico | null> {
  try {
    return await httpClient.get<UsuarioPublico>("/auth/me")
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null
    }
    throw err
  }
}
