import { httpClient } from "@/shared/api/http-client"
import type {
  ActualizarAreaInput,
  AreaResponse,
  CrearAreaInput,
  ListarAreasQuery,
  Paginated,
} from "@nexott-learn/shared-types"

function buildQueryString(query: ListarAreasQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  if (query.q && query.q.trim().length > 0) {
    params.set("q", query.q.trim())
  }
  const s = params.toString()
  return s.length > 0 ? `?${s}` : ""
}

export function listarAreas(query: ListarAreasQuery): Promise<Paginated<AreaResponse>> {
  return httpClient.get<Paginated<AreaResponse>>(`/catalogo/areas${buildQueryString(query)}`)
}

export function obtenerArea(id: string): Promise<AreaResponse> {
  return httpClient.get<AreaResponse>(`/catalogo/areas/${id}`)
}

export function crearArea(input: CrearAreaInput): Promise<AreaResponse> {
  return httpClient.post<AreaResponse>("/catalogo/areas", input)
}

export function actualizarArea(id: string, input: ActualizarAreaInput): Promise<AreaResponse> {
  return httpClient.patch<AreaResponse>(`/catalogo/areas/${id}`, input)
}

export function eliminarArea(id: string): Promise<void> {
  return httpClient.delete<void>(`/catalogo/areas/${id}`)
}
