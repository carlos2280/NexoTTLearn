import { useQuery } from "@tanstack/react-query"
import { obtenerCurso } from "../api/cursos.api"
import { CURSOS_QUERY_KEY } from "./use-listar-cursos"

export function cursoDetalleQueryKey(id: string) {
  return [...CURSOS_QUERY_KEY, "detalle", id] as const
}

export function useObtenerCurso(id: string | undefined) {
  return useQuery({
    queryKey: id ? cursoDetalleQueryKey(id) : ([...CURSOS_QUERY_KEY, "detalle", "vacio"] as const),
    queryFn: () => obtenerCurso(id ?? ""),
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}
