import { httpClient } from "@/shared/api/http-client"
import type {
  ActualizarModuloInput,
  CrearModuloInput,
  ListarModulosQuery,
  ModuloResponse,
  Paginated,
} from "@nexott-learn/shared-types"

function buildQueryString(query: ListarModulosQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  if (query.estado) {
    params.set("estado", query.estado)
  }
  if (query.q && query.q.trim().length > 0) {
    params.set("q", query.q.trim())
  }
  return `?${params.toString()}`
}

export function listarModulos(query: ListarModulosQuery): Promise<Paginated<ModuloResponse>> {
  return httpClient.get<Paginated<ModuloResponse>>(`/catalogo/modulos${buildQueryString(query)}`)
}

export function crearModulo(input: CrearModuloInput): Promise<ModuloResponse> {
  return httpClient.post<ModuloResponse>("/catalogo/modulos", input)
}

export function actualizarModulo(
  id: string,
  input: ActualizarModuloInput,
  motivo: string | undefined,
): Promise<ModuloResponse> {
  return httpClient.patch<ModuloResponse>(`/catalogo/modulos/${id}`, input, { motivo })
}

export function archivarModulo(id: string, motivo: string): Promise<void> {
  return httpClient.post<void>(`/catalogo/modulos/${id}/archivar`, undefined, { motivo })
}

export function desarchivarModulo(id: string, motivo: string): Promise<void> {
  return httpClient.post<void>(`/catalogo/modulos/${id}/desarchivar`, undefined, { motivo })
}

export function eliminarModulo(id: string, motivo: string): Promise<void> {
  return httpClient.delete<void>(`/catalogo/modulos/${id}`, { motivo })
}
