import { ApiError } from "@/shared/api/api-error"
import { httpClient } from "@/shared/api/http-client"
import {
  type EntrevistaIADetalleAdmin,
  entrevistaIADetalleAdminSchema,
} from "@nexott-learn/shared-types"

// Devuelve null cuando el back responde 404 (curso sin entrevista IA configurada).
export async function obtenerEntrevistaIa(
  cursoId: string,
): Promise<EntrevistaIADetalleAdmin | null> {
  try {
    const data = await httpClient.get<EntrevistaIADetalleAdmin>(
      `/admin/cursos/${cursoId}/entrevista-ia`,
    )
    return entrevistaIADetalleAdminSchema.parse(data)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}
