import type { ListarUsuariosQuery, UsuarioListResponse } from "@nexott-learn/shared-types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { listarUsuarios } from "../api/listar-usuarios.api"

export const ADMIN_USUARIOS_KEY = ["admin", "usuarios"] as const

export function adminUsuariosQueryKey(query: Partial<ListarUsuariosQuery>) {
  return [...ADMIN_USUARIOS_KEY, query] as const
}

export function useUsuarios(query: Partial<ListarUsuariosQuery> = {}) {
  return useQuery<UsuarioListResponse>({
    queryKey: adminUsuariosQueryKey(query),
    queryFn: () => listarUsuarios(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
