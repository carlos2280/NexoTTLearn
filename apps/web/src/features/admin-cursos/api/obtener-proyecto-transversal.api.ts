import { ApiError } from "@/shared/api/api-error"
import { httpClient } from "@/shared/api/http-client"
import {
  type ProyectoTransversalDetalleAdmin,
  proyectoTransversalDetalleAdminSchema,
} from "@nexott-learn/shared-types"

// Devuelve null cuando el back responde 404 (curso sin transversal configurado).
// El back usa la ausencia del registro como flag "no activo" (§3.6 MAESTRO).
export async function obtenerProyectoTransversal(
  cursoId: string,
): Promise<ProyectoTransversalDetalleAdmin | null> {
  try {
    const data = await httpClient.get<ProyectoTransversalDetalleAdmin>(
      `/admin/cursos/${cursoId}/proyecto-transversal`,
    )
    return proyectoTransversalDetalleAdminSchema.parse(data)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}
