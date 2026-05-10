import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarProyectoTransversalAdminInput,
  type AjustarPesosProyectoTransversalInput,
  type AjustarUmbralProyectoTransversalInput,
  type ProyectoTransversalDetalleAdmin,
  type UpsertProyectoTransversalAdminInput,
  proyectoTransversalDetalleAdminSchema,
} from "@nexott-learn/shared-types"

export async function upsertProyectoTransversal(
  cursoId: string,
  input: UpsertProyectoTransversalAdminInput,
): Promise<ProyectoTransversalDetalleAdmin> {
  const data = await httpClient.put<ProyectoTransversalDetalleAdmin>(
    `/admin/cursos/${cursoId}/proyecto-transversal`,
    input,
  )
  return proyectoTransversalDetalleAdminSchema.parse(data)
}

export async function actualizarProyectoTransversal(
  cursoId: string,
  input: ActualizarProyectoTransversalAdminInput,
): Promise<ProyectoTransversalDetalleAdmin> {
  const data = await httpClient.patch<ProyectoTransversalDetalleAdmin>(
    `/admin/cursos/${cursoId}/proyecto-transversal`,
    input,
  )
  return proyectoTransversalDetalleAdminSchema.parse(data)
}

export async function ajustarPesosProyectoTransversal(
  cursoId: string,
  input: AjustarPesosProyectoTransversalInput,
): Promise<ProyectoTransversalDetalleAdmin> {
  const data = await httpClient.post<ProyectoTransversalDetalleAdmin>(
    `/admin/cursos/${cursoId}/proyecto-transversal/pesos`,
    input,
  )
  return proyectoTransversalDetalleAdminSchema.parse(data)
}

export async function ajustarUmbralProyectoTransversal(
  cursoId: string,
  input: AjustarUmbralProyectoTransversalInput,
): Promise<ProyectoTransversalDetalleAdmin> {
  const data = await httpClient.post<ProyectoTransversalDetalleAdmin>(
    `/admin/cursos/${cursoId}/proyecto-transversal/umbral`,
    input,
  )
  return proyectoTransversalDetalleAdminSchema.parse(data)
}

export async function eliminarProyectoTransversal(cursoId: string): Promise<void> {
  await httpClient.delete(`/admin/cursos/${cursoId}/proyecto-transversal`)
}
