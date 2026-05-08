import type { ParticipanteMisCursosResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerMisCursos } from "../api/obtener-mis-cursos.api"

export const PARTICIPANTE_MIS_CURSOS_KEY = ["participante", "mis-cursos"] as const

export function useMisCursos() {
  return useQuery<ParticipanteMisCursosResponse>({
    queryKey: PARTICIPANTE_MIS_CURSOS_KEY,
    queryFn: obtenerMisCursos,
    staleTime: 60_000,
  })
}
