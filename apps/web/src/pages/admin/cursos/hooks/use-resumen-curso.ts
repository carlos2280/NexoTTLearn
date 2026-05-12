import { useListarAsignaciones } from "@/features/asignaciones/hooks/use-listar-asignaciones"
import type { Asignacion } from "@nexott-learn/shared-types"
import { useMemo } from "react"
import { type ResumenCursoKpis, calcularResumenCurso } from "../lib/resumen-curso.builder"

const PAGE_SIZE = 100

interface UseResumenCursoResult {
  readonly kpis: ResumenCursoKpis
  readonly asignaciones: readonly Asignacion[]
  readonly total: number
  readonly truncado: boolean
  readonly isLoading: boolean
}

export function useResumenCurso(cursoId: string): UseResumenCursoResult {
  const { data, isLoading } = useListarAsignaciones(cursoId, { page: 1, pageSize: PAGE_SIZE })
  const items = data?.data ?? []
  const total = data?.meta.total ?? 0
  const kpis = useMemo(() => calcularResumenCurso(items), [items])
  return { kpis, asignaciones: items, total, truncado: total > items.length, isLoading }
}
