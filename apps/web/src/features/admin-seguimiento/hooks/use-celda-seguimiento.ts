import type { CeldaDetalleResponse, SeguimientoTab } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerCeldaDetalle } from "../api/celda.api"

export const SEGUIMIENTO_CELDA_KEY = ["admin", "seguimiento", "celda"] as const

interface CeldaArgs {
  readonly cursoId: string
  readonly inscripcionId: string
  readonly areaId: string
  readonly tab: SeguimientoTab
}

export function celdaSeguimientoQueryKey(args: CeldaArgs) {
  return [...SEGUIMIENTO_CELDA_KEY, args] as const
}

export function useCeldaSeguimiento(args: Partial<CeldaArgs>) {
  const { cursoId, inscripcionId, areaId, tab = "actual" } = args
  const ready = Boolean(cursoId && inscripcionId && areaId)
  return useQuery<CeldaDetalleResponse>({
    queryKey: celdaSeguimientoQueryKey({
      cursoId: cursoId ?? "",
      inscripcionId: inscripcionId ?? "",
      areaId: areaId ?? "",
      tab,
    }),
    queryFn: () =>
      obtenerCeldaDetalle(cursoId as string, inscripcionId as string, areaId as string, tab),
    enabled: ready,
    staleTime: 15_000,
  })
}
