import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarBloqueAdminInput,
  type BloqueDetalleAdmin,
  type BloqueListAdminResponse,
  type CrearBloqueAdminInput,
  type ReordenarBloquesAdminInput,
  bloqueDetalleAdminSchema,
  bloqueListAdminResponseSchema,
} from "@nexott-learn/shared-types"

interface ScopeBloque {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
}

function path(scope: ScopeBloque): string {
  return `/admin/cursos/${scope.cursoId}/modulos/${scope.moduloId}/secciones/${scope.seccionId}/bloques`
}

export async function listarBloques(scope: ScopeBloque): Promise<BloqueListAdminResponse> {
  const data = await httpClient.get<BloqueListAdminResponse>(path(scope))
  return bloqueListAdminResponseSchema.parse(data)
}

export async function crearBloque(
  scope: ScopeBloque,
  input: CrearBloqueAdminInput,
): Promise<BloqueDetalleAdmin> {
  const data = await httpClient.post<BloqueDetalleAdmin>(path(scope), input)
  return bloqueDetalleAdminSchema.parse(data)
}

export async function actualizarBloque(
  scope: ScopeBloque,
  bloqueId: string,
  input: ActualizarBloqueAdminInput,
): Promise<BloqueDetalleAdmin> {
  const data = await httpClient.patch<BloqueDetalleAdmin>(`${path(scope)}/${bloqueId}`, input)
  return bloqueDetalleAdminSchema.parse(data)
}

export async function eliminarBloque(scope: ScopeBloque, bloqueId: string): Promise<void> {
  await httpClient.delete(`${path(scope)}/${bloqueId}`)
}

export async function reordenarBloques(
  scope: ScopeBloque,
  input: ReordenarBloquesAdminInput,
): Promise<BloqueListAdminResponse> {
  const data = await httpClient.put<BloqueListAdminResponse>(`${path(scope)}/reordenar`, input)
  return bloqueListAdminResponseSchema.parse(data)
}
