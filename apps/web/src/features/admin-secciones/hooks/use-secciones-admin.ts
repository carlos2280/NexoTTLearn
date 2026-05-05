import type { ObtenerSeccionesAdminResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerSeccionesAdmin } from "../api/obtener-secciones-admin.api"

// Key factory: ["admin", "cursos", cursoId, "modulos", moduloId, "secciones"].
// Permite invalidar la lista de secciones de un modulo sin tocar otras queries.
export const ADMIN_SECCIONES_KEY = (cursoId: string, moduloId: string) =>
  ["admin", "cursos", cursoId, "modulos", moduloId, "secciones"] as const

export function useSeccionesAdmin(cursoId: string | undefined, moduloId: string | undefined) {
  return useQuery<ObtenerSeccionesAdminResponse>({
    queryKey: ADMIN_SECCIONES_KEY(cursoId ?? "", moduloId ?? ""),
    queryFn: () => obtenerSeccionesAdmin(cursoId ?? "", moduloId ?? ""),
    enabled: Boolean(cursoId && moduloId),
    staleTime: 30_000,
  })
}
