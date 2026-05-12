import type { CasoRevision } from "@/pages/admin/inicio/inicio.types"
import { useMemo } from "react"
import { construirCasosRevision } from "../lib/casos-revision.builder"
import { useCursosDashboard } from "./use-cursos-dashboard"

interface UseCasosRevisionResult {
  readonly casos: readonly CasoRevision[]
  readonly isLoading: boolean
}

export function useCasosRevision(): UseCasosRevisionResult {
  const { data, isLoading } = useCursosDashboard()
  const casos = useMemo(() => construirCasosRevision(data?.data ?? []), [data])
  return { casos, isLoading }
}
