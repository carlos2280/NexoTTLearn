import { listarSecciones } from "@/features/admin-cursos/api/secciones.api"
import { editorKeys } from "@/features/admin-cursos/hooks/use-editor-curso"
import type { SeccionListAdminResponse } from "@nexott-learn/shared-types"
import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"

interface ModuloRef {
  readonly id: string
}

interface UseSeccionesPorModuloArgs {
  readonly cursoId: string
  readonly modulos: readonly ModuloRef[]
}

export function useSeccionesPorModulo({
  cursoId,
  modulos,
}: UseSeccionesPorModuloArgs): ReadonlyMap<string, SeccionListAdminResponse> {
  const seccionesQueries = useQueries({
    queries: modulos.map((m) => ({
      queryKey: editorKeys.secciones(cursoId, m.id),
      queryFn: () => listarSecciones({ cursoId, moduloId: m.id }),
      staleTime: 30_000,
    })),
  })

  return useMemo(() => {
    const map = new Map<string, SeccionListAdminResponse>()
    modulos.forEach((m, i) => {
      const data = seccionesQueries[i]?.data
      if (data) {
        map.set(m.id, data)
      }
    })
    return map
  }, [modulos, seccionesQueries])
}
