import { useQuery } from "@tanstack/react-query"
import { obtenerEvaluacionesDisponibles } from "../api/obtener-evaluaciones-disponibles.api"
import { CURSOS_QUERY_KEY } from "./use-listar-cursos"

export function evaluacionesDisponiblesQueryKey(cursoId: string) {
  return [...CURSOS_QUERY_KEY, "evaluaciones-disponibles", cursoId] as const
}

export function useEvaluacionesDisponibles(cursoId: string | undefined) {
  return useQuery({
    queryKey: cursoId
      ? evaluacionesDisponiblesQueryKey(cursoId)
      : ([...CURSOS_QUERY_KEY, "evaluaciones-disponibles", "vacio"] as const),
    queryFn: () => obtenerEvaluacionesDisponibles(cursoId ?? ""),
    enabled: Boolean(cursoId),
    staleTime: 30_000,
  })
}
