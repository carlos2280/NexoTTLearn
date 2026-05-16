import { httpClient } from "@/shared/api/http-client"
import type {
  BloqueDetalleResponse,
  BloqueResponse,
  CrearBloqueInput,
  ListarBloquesQuery,
  Paginated,
  PatchBloqueInput,
  PreviewImpactoEliminarBloque,
  ReordenarBloquesInput,
} from "@nexott-learn/shared-types"

function buildQueryString(query: ListarBloquesQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  if (query.seccionId) {
    params.set("seccionId", query.seccionId)
  }
  if (query.tipo) {
    params.set("tipo", query.tipo)
  }
  if (query.estado) {
    params.set("estado", query.estado)
  }
  return `?${params.toString()}`
}

export function listarBloques(query: ListarBloquesQuery): Promise<Paginated<BloqueResponse>> {
  return httpClient.get<Paginated<BloqueResponse>>(`/catalogo/bloques${buildQueryString(query)}`)
}

/**
 * Listado completo (sin paginar) de bloques de una sección. El endpoint
 * `/catalogo/secciones/:seccionId/bloques` retorna `BloqueResponse[]` sin
 * `contenido`; para renderizar el cuerpo hay que pedir el detalle por
 * cada bloque activo (`obtenerBloque`).
 */
export function listarBloquesDeSeccion(seccionId: string): Promise<readonly BloqueResponse[]> {
  return httpClient.get<readonly BloqueResponse[]>(`/catalogo/secciones/${seccionId}/bloques`)
}

export function obtenerBloque(id: string): Promise<BloqueDetalleResponse> {
  return httpClient.get<BloqueDetalleResponse>(`/catalogo/bloques/${id}`)
}

export function crearBloque(
  seccionId: string,
  input: CrearBloqueInput,
): Promise<BloqueDetalleResponse> {
  return httpClient.post<BloqueDetalleResponse>(`/catalogo/secciones/${seccionId}/bloques`, input)
}

export function patchBloque(
  bloqueId: string,
  input: PatchBloqueInput,
  motivo?: string,
): Promise<BloqueDetalleResponse> {
  return httpClient.patch<BloqueDetalleResponse>(`/catalogo/bloques/${bloqueId}`, input, {
    motivo,
  })
}

export function reordenarBloques(seccionId: string, input: ReordenarBloquesInput): Promise<void> {
  return httpClient.post<void>(`/catalogo/secciones/${seccionId}/bloques/orden`, input)
}

export function eliminarBloque(
  bloqueId: string,
  motivo: string,
): Promise<PreviewImpactoEliminarBloque> {
  return httpClient.delete<PreviewImpactoEliminarBloque>(`/catalogo/bloques/${bloqueId}`, {
    motivo,
  })
}
