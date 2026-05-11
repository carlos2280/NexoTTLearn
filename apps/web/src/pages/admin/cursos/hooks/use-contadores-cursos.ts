import { listarCursos } from "@/features/cursos/api/cursos.api"
import { CURSOS_QUERY_KEY } from "@/features/cursos/hooks/use-listar-cursos"
import type { EstadoCurso } from "@nexott-learn/shared-types"
import { useQueries } from "@tanstack/react-query"

const ESTADOS: readonly EstadoCurso[] = ["ACTIVO", "BORRADOR", "CERRADO", "ARCHIVADO"]

export interface ContadoresPorEstado {
  readonly obtener: (estado: EstadoCurso) => number
}

export function useContadoresCursos(): ContadoresPorEstado {
  const queries = useQueries({
    queries: ESTADOS.map((estado) => ({
      queryKey: [...CURSOS_QUERY_KEY, "contador", estado] as const,
      queryFn: () =>
        listarCursos({
          page: 1,
          pageSize: 1,
          estado,
          incluirArchivados: estado === "ARCHIVADO",
          sort: "createdAt" as const,
        }),
      staleTime: 30_000,
    })),
  })

  return {
    obtener: (estado) => {
      const indice = ESTADOS.indexOf(estado)
      return queries[indice]?.data?.meta.total ?? 0
    },
  }
}
