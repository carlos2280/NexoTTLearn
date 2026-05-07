import { listarEntregasProyecto } from "@/features/admin-centro-revision/api/listar-entregas-proyecto.api"
import { obtenerEntregaProyecto } from "@/features/admin-centro-revision/api/obtener-entrega-proyecto.api"
import type {
  EntregaProyectoListAdminResponse,
  ListarEntregasProyectoAdminQuery,
} from "@nexott-learn/shared-types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

export const ENTREGAS_PROYECTO_KEY = ["admin", "centro-revision", "entregas-proyecto"] as const

export function entregasProyectoQueryKey(query: Partial<ListarEntregasProyectoAdminQuery>) {
  return [...ENTREGAS_PROYECTO_KEY, query] as const
}

export function entregaProyectoDetalleQueryKey(id: string) {
  return [...ENTREGAS_PROYECTO_KEY, id] as const
}

export function useEntregasProyecto(query: Partial<ListarEntregasProyectoAdminQuery> = {}) {
  return useQuery<EntregaProyectoListAdminResponse>({
    queryKey: entregasProyectoQueryKey(query),
    queryFn: () => listarEntregasProyecto(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useEntregaProyectoDetalle(id: string | null) {
  return useQuery({
    queryKey: entregaProyectoDetalleQueryKey(id ?? ""),
    queryFn: () => obtenerEntregaProyecto(id as string),
    enabled: id !== null,
    staleTime: 30_000,
  })
}
