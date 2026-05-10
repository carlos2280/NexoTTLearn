import { httpClient } from "@/shared/api/http-client"
import {
  type AsignacionDeleteResponse,
  type AsignacionesInscripcionResponse,
  type CambiarTipoAsignacionInput,
  type ConfirmarLoteInput,
  type ConfirmarLoteResponse,
  type MatrizAsignacionesQuery,
  type MatrizAsignacionesResponse,
  type ReemplazarAsignacionesInput,
  asignacionDeleteResponseSchema,
  asignacionesInscripcionResponseSchema,
  confirmarLoteResponseSchema,
  matrizAsignacionesResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerMatrizAsignaciones(
  cursoId: string,
  query: Partial<MatrizAsignacionesQuery> = {},
): Promise<MatrizAsignacionesResponse> {
  const search = new URLSearchParams()
  if (query.q) {
    search.set("q", query.q)
  }
  const qs = search.toString()
  const base = `/admin/cursos/${cursoId}/diagnostico/asignaciones`
  const path = qs ? `${base}?${qs}` : base
  const data = await httpClient.get<MatrizAsignacionesResponse>(path)
  return matrizAsignacionesResponseSchema.parse(data)
}

export async function obtenerAsignacionesInscripcion(
  inscripcionId: string,
): Promise<AsignacionesInscripcionResponse> {
  const data = await httpClient.get<AsignacionesInscripcionResponse>(
    `/admin/inscripciones/${inscripcionId}/asignaciones`,
  )
  return asignacionesInscripcionResponseSchema.parse(data)
}

export async function reemplazarAsignaciones(
  inscripcionId: string,
  input: ReemplazarAsignacionesInput,
): Promise<AsignacionesInscripcionResponse> {
  const data = await httpClient.put<AsignacionesInscripcionResponse>(
    `/admin/inscripciones/${inscripcionId}/asignaciones`,
    input,
  )
  return asignacionesInscripcionResponseSchema.parse(data)
}

export async function cambiarTipoAsignacion(
  inscripcionId: string,
  moduloId: string,
  input: CambiarTipoAsignacionInput,
): Promise<AsignacionesInscripcionResponse> {
  const data = await httpClient.patch<AsignacionesInscripcionResponse>(
    `/admin/inscripciones/${inscripcionId}/asignaciones/${moduloId}`,
    input,
  )
  return asignacionesInscripcionResponseSchema.parse(data)
}

export async function eliminarAsignacion(
  inscripcionId: string,
  moduloId: string,
): Promise<AsignacionDeleteResponse> {
  const data = await httpClient.delete<AsignacionDeleteResponse>(
    `/admin/inscripciones/${inscripcionId}/asignaciones/${moduloId}`,
  )
  return asignacionDeleteResponseSchema.parse(data)
}

export async function confirmarLoteAsignaciones(
  cursoId: string,
  input: ConfirmarLoteInput,
): Promise<ConfirmarLoteResponse> {
  const data = await httpClient.post<ConfirmarLoteResponse>(
    `/admin/cursos/${cursoId}/diagnostico/asignaciones/confirmar-lote`,
    input,
  )
  return confirmarLoteResponseSchema.parse(data)
}
