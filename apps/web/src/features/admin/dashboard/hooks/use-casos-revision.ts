import { useCentroRevision } from "@/features/reportes/hooks/use-centro-revision"
import type { CasoRevision } from "@/pages/admin/inicio/inicio.types"
import { useMemo } from "react"
import { construirCasosRevision } from "../lib/casos-revision.builder"

interface UseCasosRevisionResult {
  readonly casos: readonly CasoRevision[]
  readonly isLoading: boolean
  readonly error: Error | null
  readonly refetch: () => Promise<unknown>
  readonly totalPendientes: number
}

export function useCasosRevision(): UseCasosRevisionResult {
  const { data, isLoading, error, refetch } = useCentroRevision()
  const casos = useMemo(() => construirCasosRevision(data), [data])
  const totalPendientes = data ? data.totales.transversales + data.totales.entrevistasIa : 0

  return {
    casos,
    isLoading,
    error: error ?? null,
    refetch,
    totalPendientes,
  }
}
