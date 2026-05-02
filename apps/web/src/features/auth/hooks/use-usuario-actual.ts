import type { UsuarioPublico } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerUsuarioActual } from "../api/obtener-usuario-actual.api"

export const USUARIO_ACTUAL_KEY = ["auth", "usuario-actual"] as const

export function useUsuarioActual() {
  return useQuery<UsuarioPublico | null>({
    queryKey: USUARIO_ACTUAL_KEY,
    queryFn: obtenerUsuarioActual,
    staleTime: 5 * 60_000,
  })
}
