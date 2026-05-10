import type {
  EvaluacionInicialDetalleAdmin,
  MatrizDiagnosticoQuery,
  MatrizDiagnosticoResponse,
  UpsertEvaluacionInicialAdminInput,
} from "@nexott-learn/shared-types"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { obtenerMatrizDiagnostico, upsertEvaluacionCelda } from "../api/diagnostico-matriz.api"

export const DIAGNOSTICO_MATRIZ_KEY = ["admin", "diagnostico", "matriz"] as const

export function diagnosticoMatrizQueryKey(cursoId: string, query: Partial<MatrizDiagnosticoQuery>) {
  return [...DIAGNOSTICO_MATRIZ_KEY, cursoId, query] as const
}

export function useDiagnosticoMatriz(
  cursoId: string | undefined,
  query: Partial<MatrizDiagnosticoQuery> = {},
) {
  return useQuery<MatrizDiagnosticoResponse>({
    queryKey: diagnosticoMatrizQueryKey(cursoId ?? "", query),
    queryFn: () => obtenerMatrizDiagnostico(cursoId as string, query),
    enabled: Boolean(cursoId),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}

interface UpsertVars {
  readonly inscripcionId: string
  readonly areaId: string
  readonly input: UpsertEvaluacionInicialAdminInput
}

export function useUpsertEvaluacionCelda() {
  const qc = useQueryClient()
  return useMutation<EvaluacionInicialDetalleAdmin, Error, UpsertVars>({
    mutationFn: ({ inscripcionId, areaId, input }) =>
      upsertEvaluacionCelda(inscripcionId, areaId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DIAGNOSTICO_MATRIZ_KEY })
    },
  })
}
