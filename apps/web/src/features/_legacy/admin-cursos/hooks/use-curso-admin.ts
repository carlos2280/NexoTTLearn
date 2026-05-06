import type { CursoAdminDetalle } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerCursoAdmin } from "../api/obtener-curso-admin.api"

// Key factory: ["admin", "cursos", "detalle", id] permite invalidar el detalle
// puntual sin tocar la lista (que vive en ADMIN_CURSOS_KEY).
export const adminCursoDetalleKey = (id: string) => ["admin", "cursos", "detalle", id] as const

interface UseCursoAdminOptions {
  readonly enabled?: boolean
}

export function useCursoAdmin(id: string | undefined, options?: UseCursoAdminOptions) {
  return useQuery<CursoAdminDetalle>({
    queryKey: adminCursoDetalleKey(id ?? ""),
    queryFn: () => obtenerCursoAdmin(id ?? ""),
    enabled: (options?.enabled ?? true) && Boolean(id),
    staleTime: 60_000,
  })
}
