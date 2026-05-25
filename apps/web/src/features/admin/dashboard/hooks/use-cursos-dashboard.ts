import { listarCursos } from "@/features/cursos/api/cursos.api"
import type { CursoResumen, Paginated } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"

export const CURSOS_DASHBOARD_KEY = ["admin", "dashboard", "cursos"] as const

export function useCursosDashboard(): UseQueryResult<Paginated<CursoResumen>, Error> {
  return useQuery({
    queryKey: CURSOS_DASHBOARD_KEY,
    queryFn: () =>
      listarCursos({
        page: 1,
        pageSize: 100,
        incluirArchivados: true,
        sort: "fechaDeadline",
      }),
    staleTime: 60_000,
  })
}
