import { useQuery } from "@tanstack/react-query"
import { obtenerResumenCierre } from "../api/obtener-resumen-cierre.api"

export const RESUMEN_CIERRE_KEY = (cursoId: string) =>
  ["me", "cursos", cursoId, "resumen-cierre"] as const

export function useResumenCierre(cursoId: string | undefined) {
  return useQuery({
    queryKey: cursoId ? RESUMEN_CIERRE_KEY(cursoId) : (["me", "cursos", "noop"] as const),
    queryFn: () => obtenerResumenCierre(cursoId ?? ""),
    enabled: Boolean(cursoId),
    staleTime: 60_000,
  })
}
