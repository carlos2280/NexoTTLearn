import type { KpisCursoResponse, SeguimientoTab } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerKpisSeguimiento } from "../api/kpis.api"

export const SEGUIMIENTO_KPIS_KEY = ["admin", "seguimiento", "kpis"] as const

export function kpisSeguimientoQueryKey(cursoId: string, tab: SeguimientoTab) {
  return [...SEGUIMIENTO_KPIS_KEY, cursoId, tab] as const
}

export function useKpisSeguimiento(cursoId: string | undefined, tab: SeguimientoTab = "actual") {
  return useQuery<KpisCursoResponse>({
    queryKey: kpisSeguimientoQueryKey(cursoId ?? "", tab),
    queryFn: () => obtenerKpisSeguimiento(cursoId as string, tab),
    enabled: Boolean(cursoId),
    staleTime: 15_000,
  })
}
