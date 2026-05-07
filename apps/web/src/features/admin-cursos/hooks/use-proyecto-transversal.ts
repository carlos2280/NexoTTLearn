import type { ProyectoTransversalDetalleAdmin } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerProyectoTransversal } from "../api/obtener-proyecto-transversal.api"
import { ADMIN_CURSOS_KEY } from "./use-cursos"

export function adminProyectoTransversalQueryKey(cursoId: string) {
  return [...ADMIN_CURSOS_KEY, "proyecto-transversal", cursoId] as const
}

export function useProyectoTransversal(cursoId: string | undefined, enabled = true) {
  return useQuery<ProyectoTransversalDetalleAdmin | null>({
    queryKey: adminProyectoTransversalQueryKey(cursoId ?? ""),
    queryFn: () => obtenerProyectoTransversal(cursoId as string),
    enabled: Boolean(cursoId) && enabled,
    staleTime: 30_000,
  })
}
