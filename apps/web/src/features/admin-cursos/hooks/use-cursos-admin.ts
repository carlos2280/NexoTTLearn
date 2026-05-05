import type { ObtenerCursosAdminResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerCursosAdmin } from "../api/obtener-cursos-admin.api"

export const ADMIN_CURSOS_KEY = ["admin", "cursos"] as const

export function useCursosAdmin() {
  return useQuery<ObtenerCursosAdminResponse>({
    queryKey: ADMIN_CURSOS_KEY,
    queryFn: obtenerCursosAdmin,
    staleTime: 60_000,
  })
}
