import { listarEntregasBloque } from "@/features/admin-centro-revision/api/listar-entregas-bloque.api"
import { obtenerEntregaBloque } from "@/features/admin-centro-revision/api/obtener-entrega-bloque.api"
import type {
  EntregaBloqueListAdminResponse,
  ListarEntregasBloqueAdminQuery,
} from "@nexott-learn/shared-types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

export const ENTREGAS_BLOQUE_KEY = ["admin", "centro-revision", "entregas-bloque"] as const

export function entregasBloqueQueryKey(query: Partial<ListarEntregasBloqueAdminQuery>) {
  return [...ENTREGAS_BLOQUE_KEY, query] as const
}

export function entregaBloqueDetalleQueryKey(id: string) {
  return [...ENTREGAS_BLOQUE_KEY, id] as const
}

export function useEntregasBloque(query: Partial<ListarEntregasBloqueAdminQuery> = {}) {
  return useQuery<EntregaBloqueListAdminResponse>({
    queryKey: entregasBloqueQueryKey(query),
    queryFn: () => listarEntregasBloque(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useEntregaBloqueDetalle(id: string | null) {
  return useQuery({
    queryKey: entregaBloqueDetalleQueryKey(id ?? ""),
    queryFn: () => obtenerEntregaBloque(id as string),
    enabled: id !== null,
    staleTime: 30_000,
  })
}
