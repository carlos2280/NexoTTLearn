import type {
  InscripcionDeleteAdminResponse,
  InscripcionDiagnosticoListResponse,
  ListarInscripcionesCursoQuery,
} from "@nexott-learn/shared-types"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listarInscripcionesCurso, quitarInscripcionDelCurso } from "../api/inscripciones-curso.api"

export const INSCRIPCIONES_CURSO_KEY = ["admin", "diagnostico", "inscripciones"] as const

export function inscripcionesCursoQueryKey(
  cursoId: string,
  query: Partial<ListarInscripcionesCursoQuery>,
) {
  return [...INSCRIPCIONES_CURSO_KEY, cursoId, query] as const
}

export function useInscripcionesCurso(
  cursoId: string | undefined,
  query: Partial<ListarInscripcionesCursoQuery> = {},
) {
  return useQuery<InscripcionDiagnosticoListResponse>({
    queryKey: inscripcionesCursoQueryKey(cursoId ?? "", query),
    queryFn: () => listarInscripcionesCurso(cursoId as string, query),
    enabled: Boolean(cursoId),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}

interface QuitarVars {
  readonly cursoId: string
  readonly inscripcionId: string
}

export function useQuitarInscripcion() {
  const qc = useQueryClient()
  return useMutation<InscripcionDeleteAdminResponse, Error, QuitarVars>({
    mutationFn: ({ cursoId, inscripcionId }) => quitarInscripcionDelCurso(cursoId, inscripcionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSCRIPCIONES_CURSO_KEY })
    },
  })
}
