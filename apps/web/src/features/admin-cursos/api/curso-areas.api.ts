import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarCursoAreaInput,
  type AgregarCursoAreaInput,
  type CursoAreaMutacionResponse,
  type ReemplazarCursoAreaInput,
  cursoAreaMutacionResponseSchema,
} from "@nexott-learn/shared-types"

export async function agregarCursoArea(
  cursoId: string,
  input: AgregarCursoAreaInput,
): Promise<CursoAreaMutacionResponse> {
  const data = await httpClient.post<CursoAreaMutacionResponse>(
    `/admin/cursos/${cursoId}/areas`,
    input,
  )
  return cursoAreaMutacionResponseSchema.parse(data)
}

export async function actualizarCursoArea(
  cursoId: string,
  cursoAreaId: string,
  input: ActualizarCursoAreaInput,
): Promise<CursoAreaMutacionResponse> {
  const data = await httpClient.patch<CursoAreaMutacionResponse>(
    `/admin/cursos/${cursoId}/areas/${cursoAreaId}`,
    input,
  )
  return cursoAreaMutacionResponseSchema.parse(data)
}

export async function reemplazarCursoArea(
  cursoId: string,
  cursoAreaId: string,
  input: ReemplazarCursoAreaInput,
): Promise<CursoAreaMutacionResponse> {
  const data = await httpClient.post<CursoAreaMutacionResponse>(
    `/admin/cursos/${cursoId}/areas/${cursoAreaId}/reemplazar`,
    input,
  )
  return cursoAreaMutacionResponseSchema.parse(data)
}

export async function eliminarCursoArea(cursoId: string, cursoAreaId: string): Promise<void> {
  await httpClient.delete(`/admin/cursos/${cursoId}/areas/${cursoAreaId}`)
}
