import { useQuery } from "@tanstack/react-query"
import { obtenerModulo } from "../api/modulos.api"
import { MODULOS_QUERY_KEY } from "./use-listar-modulos"

export function moduloDetalleQueryKey(id: string) {
  return [...MODULOS_QUERY_KEY, "detalle", id] as const
}

export function useObtenerModulo(id: string | undefined) {
  return useQuery({
    queryKey: id
      ? moduloDetalleQueryKey(id)
      : ([...MODULOS_QUERY_KEY, "detalle", "vacio"] as const),
    queryFn: () => obtenerModulo(id ?? ""),
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}
