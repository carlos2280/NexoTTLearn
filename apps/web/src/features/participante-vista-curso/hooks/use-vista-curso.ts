import type { ParticipanteVistaCursoResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerVistaCurso } from "../api/obtener-vista-curso.api"

export const PARTICIPANTE_VISTA_CURSO_KEY = (slug: string) =>
  ["participante", "vista-curso", slug] as const

export function useVistaCurso(slug: string) {
  return useQuery<ParticipanteVistaCursoResponse>({
    queryKey: PARTICIPANTE_VISTA_CURSO_KEY(slug),
    queryFn: () => obtenerVistaCurso(slug),
    staleTime: 60_000,
    enabled: slug.length > 0,
  })
}
