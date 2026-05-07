import { httpClient } from "@/shared/api/http-client"
import {
  type CrearSeccionAdminInput,
  type ReordenarSeccionesAdminInput,
  type SeccionDetalleAdmin,
  type SeccionListAdminResponse,
  seccionDetalleAdminSchema,
  seccionListAdminResponseSchema,
} from "@nexott-learn/shared-types"

interface ScopeSeccion {
  readonly cursoId: string
  readonly moduloId: string
}

function path(scope: ScopeSeccion): string {
  return `/admin/cursos/${scope.cursoId}/modulos/${scope.moduloId}/secciones`
}

export async function listarSecciones(scope: ScopeSeccion): Promise<SeccionListAdminResponse> {
  const data = await httpClient.get<SeccionListAdminResponse>(path(scope))
  return seccionListAdminResponseSchema.parse(data)
}

export async function crearSeccion(
  scope: ScopeSeccion,
  input: CrearSeccionAdminInput,
): Promise<SeccionDetalleAdmin> {
  const data = await httpClient.post<SeccionDetalleAdmin>(path(scope), input)
  return seccionDetalleAdminSchema.parse(data)
}

export async function actualizarSeccion(
  scope: ScopeSeccion,
  seccionId: string,
  input: { readonly titulo?: string },
): Promise<SeccionDetalleAdmin> {
  const data = await httpClient.patch<SeccionDetalleAdmin>(`${path(scope)}/${seccionId}`, input)
  return seccionDetalleAdminSchema.parse(data)
}

export async function eliminarSeccion(scope: ScopeSeccion, seccionId: string): Promise<void> {
  await httpClient.delete(`${path(scope)}/${seccionId}`)
}

export async function reordenarSecciones(
  scope: ScopeSeccion,
  input: ReordenarSeccionesAdminInput,
): Promise<SeccionListAdminResponse> {
  const data = await httpClient.put<SeccionListAdminResponse>(`${path(scope)}/reordenar`, input)
  return seccionListAdminResponseSchema.parse(data)
}
