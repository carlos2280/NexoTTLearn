import { useQuery } from "@tanstack/react-query"
import { obtenerAsignacion } from "../api/asignaciones.api"
import { ASIGNACIONES_QUERY_KEY } from "./use-listar-asignaciones"

export function asignacionDetalleQueryKey(asignacionId: string) {
  return [...ASIGNACIONES_QUERY_KEY, "detalle", asignacionId] as const
}

export function useObtenerAsignacion(asignacionId: string | undefined) {
  return useQuery({
    queryKey: asignacionId
      ? asignacionDetalleQueryKey(asignacionId)
      : ([...ASIGNACIONES_QUERY_KEY, "detalle", "vacio"] as const),
    queryFn: () => obtenerAsignacion(asignacionId ?? ""),
    enabled: Boolean(asignacionId),
    staleTime: 30_000,
  })
}
