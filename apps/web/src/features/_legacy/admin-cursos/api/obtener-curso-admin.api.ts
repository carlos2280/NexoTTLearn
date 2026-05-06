import { httpClient } from "@/shared/api/http-client"
import { type CursoAdminDetalle, cursoAdminDetalleSchema } from "@nexott-learn/shared-types"

/**
 * Obtiene el detalle de un curso para la pantalla AD03 — Editar Curso.
 *
 * Valida con Zod en el cliente para blindar el form contra cambios de
 * contrato (campos faltantes, enums fuera de rango, umbrales > 100).
 */
export async function obtenerCursoAdmin(id: string): Promise<CursoAdminDetalle> {
  const data = await httpClient.get<CursoAdminDetalle>(`/admin/cursos/${id}`)
  return cursoAdminDetalleSchema.parse(data)
}
