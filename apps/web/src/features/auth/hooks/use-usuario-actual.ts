import { ApiError } from "@/shared/api/api-error"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerUsuarioActual } from "../api/me.api"
import type { UsuarioSesion } from "../types"

export const USUARIO_ACTUAL_KEY = ["auth", "usuario-actual"] as const

export function useUsuarioActual(): UseQueryResult<UsuarioSesion, ApiError> {
  return useQuery<UsuarioSesion, ApiError>({
    queryKey: USUARIO_ACTUAL_KEY,
    queryFn: obtenerUsuarioActual,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) {
        return false
      }
      return failureCount < 1
    },
    staleTime: 5 * 60_000,
  })
}
