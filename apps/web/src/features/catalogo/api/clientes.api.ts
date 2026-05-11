import { httpClient } from "@/shared/api/http-client"
import type {
  ActualizarClienteInput,
  ClienteDetalleResponse,
  ClienteResponse,
  CrearClienteInput,
  ListarClientesQuery,
  Paginated,
} from "@nexott-learn/shared-types"

function buildQueryString(query: ListarClientesQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  if (query.activo !== undefined) {
    params.set("activo", String(query.activo))
  }
  if (query.q && query.q.trim().length > 0) {
    params.set("q", query.q.trim())
  }
  return `?${params.toString()}`
}

export function listarClientes(query: ListarClientesQuery): Promise<Paginated<ClienteResponse>> {
  return httpClient.get<Paginated<ClienteResponse>>(`/catalogo/clientes${buildQueryString(query)}`)
}

export function obtenerCliente(id: string): Promise<ClienteDetalleResponse> {
  return httpClient.get<ClienteDetalleResponse>(`/catalogo/clientes/${id}`)
}

export function crearCliente(input: CrearClienteInput): Promise<ClienteResponse> {
  return httpClient.post<ClienteResponse>("/catalogo/clientes", input)
}

export function actualizarCliente(
  id: string,
  input: ActualizarClienteInput,
  motivo: string | undefined,
): Promise<ClienteResponse> {
  return httpClient.patch<ClienteResponse>(`/catalogo/clientes/${id}`, input, { motivo })
}

export function eliminarCliente(id: string, motivo: string): Promise<void> {
  return httpClient.delete<void>(`/catalogo/clientes/${id}`, { motivo })
}
