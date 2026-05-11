import { httpClient } from "@/shared/api/http-client"
import type {
  ActualizarSeccionInput,
  CrearSeccionInput,
  ListarSeccionesQuery,
  Paginated,
  ReordenarSeccionesInput,
  SeccionResponse,
} from "@nexott-learn/shared-types"

function buildQueryString(query: ListarSeccionesQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  if (query.moduloId) {
    params.set("moduloId", query.moduloId)
  }
  return `?${params.toString()}`
}

export function listarSecciones(query: ListarSeccionesQuery): Promise<Paginated<SeccionResponse>> {
  return httpClient.get<Paginated<SeccionResponse>>(`/catalogo/secciones${buildQueryString(query)}`)
}

export function obtenerSeccion(id: string): Promise<SeccionResponse> {
  return httpClient.get<SeccionResponse>(`/catalogo/secciones/${id}`)
}

export function crearSeccion(moduloId: string, input: CrearSeccionInput): Promise<SeccionResponse> {
  return httpClient.post<SeccionResponse>(`/catalogo/modulos/${moduloId}/secciones`, input)
}

export function actualizarSeccion(
  moduloId: string,
  seccionId: string,
  input: ActualizarSeccionInput,
): Promise<SeccionResponse> {
  return httpClient.patch<SeccionResponse>(
    `/catalogo/modulos/${moduloId}/secciones/${seccionId}`,
    input,
  )
}

export function reordenarSecciones(
  moduloId: string,
  input: ReordenarSeccionesInput,
): Promise<void> {
  return httpClient.post<void>(`/catalogo/modulos/${moduloId}/secciones/orden`, input)
}

export function eliminarSeccion(
  moduloId: string,
  seccionId: string,
  motivo: string,
): Promise<void> {
  return httpClient.delete<void>(`/catalogo/modulos/${moduloId}/secciones/${seccionId}`, {
    motivo,
  })
}
