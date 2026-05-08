import type {
  CandidatosDisponiblesQuery,
  CandidatosDisponiblesResponse,
  InvitarCandidatosBody,
  InvitarCandidatosResponse,
} from "@nexott-learn/shared-types"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { buscarCandidatosDisponibles, invitarCandidatos } from "../api/inscripciones-curso.api"
import { INSCRIPCIONES_CURSO_KEY } from "./use-inscripciones-curso"

const CANDIDATOS_DISPONIBLES_KEY = ["admin", "diagnostico", "candidatos-disponibles"] as const

export function candidatosDisponiblesQueryKey(
  cursoId: string,
  query: Partial<CandidatosDisponiblesQuery>,
) {
  return [...CANDIDATOS_DISPONIBLES_KEY, cursoId, query] as const
}

interface UseCandidatosDisponiblesOptions {
  readonly cursoId: string | undefined
  readonly q?: string
  readonly limit?: number
  readonly habilitado?: boolean
}

export function useCandidatosDisponibles({
  cursoId,
  q,
  limit,
  habilitado = true,
}: UseCandidatosDisponiblesOptions) {
  const query: Partial<CandidatosDisponiblesQuery> = { q, limit }
  return useQuery<CandidatosDisponiblesResponse>({
    queryKey: candidatosDisponiblesQueryKey(cursoId ?? "", query),
    queryFn: () => buscarCandidatosDisponibles(cursoId as string, query),
    enabled: Boolean(cursoId) && habilitado,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}

interface InvitarVars {
  readonly cursoId: string
  readonly body: InvitarCandidatosBody
}

export function useInvitarCandidatos() {
  const qc = useQueryClient()
  return useMutation<InvitarCandidatosResponse, Error, InvitarVars>({
    mutationFn: ({ cursoId, body }) => invitarCandidatos(cursoId, body),
    onSuccess: (_data, { cursoId }) => {
      qc.invalidateQueries({ queryKey: INSCRIPCIONES_CURSO_KEY })
      qc.invalidateQueries({ queryKey: [...CANDIDATOS_DISPONIBLES_KEY, cursoId] })
    },
  })
}
