import { useQuery } from "@tanstack/react-query"
import {
  obtenerBloquesEvaluables,
  obtenerDetalleBloqueEvaluable,
} from "../api/obtener-bloques-evaluables.api"
import { CURSOS_QUERY_KEY } from "./use-listar-cursos"

export function bloquesEvaluablesQueryKey(cursoId: string) {
  return [...CURSOS_QUERY_KEY, "bloques-evaluables", cursoId] as const
}

export function detalleBloqueEvaluableQueryKey(cursoId: string, bloqueId: string) {
  return [...CURSOS_QUERY_KEY, "bloques-evaluables", cursoId, "detalle", bloqueId] as const
}

export function useBloquesEvaluables(cursoId: string | undefined) {
  return useQuery({
    queryKey: cursoId
      ? bloquesEvaluablesQueryKey(cursoId)
      : ([...CURSOS_QUERY_KEY, "bloques-evaluables", "vacio"] as const),
    queryFn: () => obtenerBloquesEvaluables(cursoId ?? ""),
    enabled: Boolean(cursoId),
    staleTime: 30_000,
  })
}

export function useDetalleBloqueEvaluable(
  cursoId: string | undefined,
  bloqueId: string | undefined,
) {
  return useQuery({
    queryKey:
      cursoId && bloqueId
        ? detalleBloqueEvaluableQueryKey(cursoId, bloqueId)
        : ([...CURSOS_QUERY_KEY, "bloques-evaluables", "detalle", "vacio"] as const),
    queryFn: () => obtenerDetalleBloqueEvaluable(cursoId ?? "", bloqueId ?? ""),
    enabled: Boolean(cursoId && bloqueId),
    staleTime: 30_000,
  })
}
