import { listarAuditoria } from "@/features/admin/api/auditoria.api"
import type { AuditoriaResumen, Paginated } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"

export const AUDITORIA_KEYS = {
  all: ["admin", "auditoria"] as const,
  reciente: (limit: number) => [...AUDITORIA_KEYS.all, "reciente", limit] as const,
}

interface UseAuditoriaRecienteOptions {
  readonly limit?: number
  readonly refetchIntervalMs?: number
}

export function useAuditoriaReciente(
  options?: UseAuditoriaRecienteOptions,
): UseQueryResult<Paginated<AuditoriaResumen>, Error> {
  const limit = options?.limit ?? 10
  return useQuery({
    queryKey: AUDITORIA_KEYS.reciente(limit),
    queryFn: ({ signal }) => listarAuditoria({ page: 1, pageSize: limit }, { signal }),
    staleTime: 30_000,
    refetchInterval: options?.refetchIntervalMs,
    refetchOnWindowFocus: false,
  })
}
