import type { ObtenerModulosAdminResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerModulosAdmin } from "../api/obtener-modulos-admin.api"

// Key factory: ["admin", "cursos", cursoId, "modulos"]. Permite invalidar
// puntualmente la lista de modulos de un curso sin tocar otras queries.
export const ADMIN_MODULOS_KEY = (cursoId: string) =>
  ["admin", "cursos", cursoId, "modulos"] as const

export function useModulosAdmin(cursoId: string | undefined) {
  return useQuery<ObtenerModulosAdminResponse>({
    queryKey: ADMIN_MODULOS_KEY(cursoId ?? ""),
    queryFn: () => obtenerModulosAdmin(cursoId ?? ""),
    enabled: Boolean(cursoId),
    staleTime: 30_000,
  })
}
