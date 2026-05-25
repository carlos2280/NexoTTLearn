import { ApiError } from "@/shared/api/api-error"
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
    // No tiene sentido reintentar un 4xx: el estado del curso no va a cambiar
    // por refrescar (CONFLICT_CURSO_NO_CERRADO se resuelve redirigiendo en la
    // pantalla, NOT_FOUND/FORBIDDEN tampoco son recuperables del lado cliente).
    retry: (_failureCount, error) =>
      !(error instanceof ApiError && error.status >= 400 && error.status < 500),
  })
}
