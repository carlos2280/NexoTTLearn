import type { EntrevistaIADetalleAdmin } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerEntrevistaIa } from "../api/obtener-entrevista-ia.api"
import { ADMIN_CURSOS_KEY } from "./use-cursos"

export function adminEntrevistaIaQueryKey(cursoId: string) {
  return [...ADMIN_CURSOS_KEY, "entrevista-ia", cursoId] as const
}

export function useEntrevistaIa(cursoId: string | undefined, enabled = true) {
  return useQuery<EntrevistaIADetalleAdmin | null>({
    queryKey: adminEntrevistaIaQueryKey(cursoId ?? ""),
    queryFn: () => obtenerEntrevistaIa(cursoId as string),
    enabled: Boolean(cursoId) && enabled,
    staleTime: 30_000,
  })
}
