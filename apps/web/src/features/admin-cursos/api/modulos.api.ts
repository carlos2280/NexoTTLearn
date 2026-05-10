import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarModuloAdminInput,
  type CrearModuloAdminInput,
  type ModuloDetalleAdmin,
  type ModuloListAdminResponse,
  type ReordenarModulosAdminInput,
  moduloDetalleAdminSchema,
  moduloListAdminResponseSchema,
} from "@nexott-learn/shared-types"

export async function listarModulos(cursoId: string): Promise<ModuloListAdminResponse> {
  const data = await httpClient.get<ModuloListAdminResponse>(`/admin/cursos/${cursoId}/modulos`)
  return moduloListAdminResponseSchema.parse(data)
}

export async function crearModulo(
  cursoId: string,
  input: CrearModuloAdminInput,
): Promise<ModuloDetalleAdmin> {
  const data = await httpClient.post<ModuloDetalleAdmin>(`/admin/cursos/${cursoId}/modulos`, input)
  return moduloDetalleAdminSchema.parse(data)
}

export async function actualizarModulo(
  cursoId: string,
  moduloId: string,
  input: ActualizarModuloAdminInput,
): Promise<ModuloDetalleAdmin> {
  const data = await httpClient.patch<ModuloDetalleAdmin>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}`,
    input,
  )
  return moduloDetalleAdminSchema.parse(data)
}

export async function archivarModulo(
  cursoId: string,
  moduloId: string,
): Promise<ModuloDetalleAdmin> {
  const data = await httpClient.post<ModuloDetalleAdmin>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/archivar`,
    {},
  )
  return moduloDetalleAdminSchema.parse(data)
}

export async function desarchivarModulo(
  cursoId: string,
  moduloId: string,
): Promise<ModuloDetalleAdmin> {
  const data = await httpClient.post<ModuloDetalleAdmin>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/desarchivar`,
    {},
  )
  return moduloDetalleAdminSchema.parse(data)
}

export async function eliminarModulo(cursoId: string, moduloId: string): Promise<void> {
  await httpClient.delete(`/admin/cursos/${cursoId}/modulos/${moduloId}`)
}

export async function reordenarModulos(
  cursoId: string,
  input: ReordenarModulosAdminInput,
): Promise<ModuloListAdminResponse> {
  const data = await httpClient.put<ModuloListAdminResponse>(
    `/admin/cursos/${cursoId}/modulos/reordenar`,
    input,
  )
  return moduloListAdminResponseSchema.parse(data)
}
