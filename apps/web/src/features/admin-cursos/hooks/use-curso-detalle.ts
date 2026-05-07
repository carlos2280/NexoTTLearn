import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerCursoDetalle } from "../api/obtener-curso-detalle.api"
import { ADMIN_CURSOS_KEY } from "./use-cursos"

export function adminCursoDetalleQueryKey(id: string) {
  return [...ADMIN_CURSOS_KEY, "detalle", id] as const
}

export function useCursoDetalle(id: string | undefined) {
  return useQuery<CursoDetalle>({
    queryKey: adminCursoDetalleQueryKey(id ?? ""),
    queryFn: () => obtenerCursoDetalle(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}
