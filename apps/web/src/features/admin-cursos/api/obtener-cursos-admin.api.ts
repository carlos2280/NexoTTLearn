import { httpClient } from "@/shared/api/http-client"
import {
  type ObtenerCursosAdminResponse,
  obtenerCursosAdminResponseSchema,
} from "@nexott-learn/shared-types"

/**
 * Lista los cursos visibles para el administrador.
 *
 * Validamos el response con Zod en el cliente: blinda el adapter contra
 * cambios de contrato accidentales (campos faltantes, enums fuera de rango).
 */
export async function obtenerCursosAdmin(): Promise<ObtenerCursosAdminResponse> {
  const data = await httpClient.get<ObtenerCursosAdminResponse>("/admin/cursos")
  return obtenerCursosAdminResponseSchema.parse(data)
}
