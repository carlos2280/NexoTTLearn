import { httpClient } from "@/shared/api/http-client"
import {
  type ListarUsuariosQuery,
  type UsuarioListResponse,
  usuarioListResponseSchema,
} from "@nexott-learn/shared-types"

export async function listarUsuarios(
  query: Partial<ListarUsuariosQuery> = {},
): Promise<UsuarioListResponse> {
  const search = new URLSearchParams()
  if (query.q) {
    search.set("q", query.q)
  }
  if (query.rol) {
    search.set("rol", query.rol)
  }
  if (query.estado) {
    search.set("estado", query.estado)
  }
  if (typeof query.mfa === "boolean") {
    search.set("mfa", String(query.mfa))
  }
  if (query.page !== undefined) {
    search.set("page", String(query.page))
  }
  if (query.pageSize !== undefined) {
    search.set("pageSize", String(query.pageSize))
  }
  const qs = search.toString()
  const path = qs ? `/admin/usuarios?${qs}` : "/admin/usuarios"
  const data = await httpClient.get<UsuarioListResponse>(path)
  return usuarioListResponseSchema.parse(data)
}
