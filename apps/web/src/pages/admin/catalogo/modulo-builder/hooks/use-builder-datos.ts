import { listarBloques } from "@/features/catalogo/api/bloques.api"
import { BLOQUES_QUERY_KEY } from "@/features/catalogo/hooks/use-listar-bloques"
import { useListarSecciones } from "@/features/catalogo/hooks/use-listar-secciones"
import { useObtenerModulo } from "@/features/catalogo/hooks/use-obtener-modulo"
import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import type { SeccionConBloques } from "../types"

const SECCIONES_PAGE_SIZE = 100
const BLOQUES_PAGE_SIZE = 100

/**
 * Carga el modulo, sus secciones y los bloques de cada seccion.
 *
 * Bloques se piden con una query por seccion (filtrando por `seccionId`) para
 * cumplir el cap de 100 del contrato y para no traer bloques de otros modulos.
 */
export function useBuilderDatos(moduloId: string | undefined) {
  const moduloQuery = useObtenerModulo(moduloId)
  const seccionesQuery = useListarSecciones({
    page: 1,
    pageSize: SECCIONES_PAGE_SIZE,
    moduloId,
  })

  const secciones = useMemo(
    () => [...(seccionesQuery.data?.data ?? [])].sort((a, b) => a.orden - b.orden),
    [seccionesQuery.data],
  )

  const bloquesQueries = useQueries({
    queries: secciones.map((seccion) => ({
      queryKey: [
        ...BLOQUES_QUERY_KEY,
        "listar",
        { page: 1, pageSize: BLOQUES_PAGE_SIZE, seccionId: seccion.id },
      ] as const,
      queryFn: () => listarBloques({ page: 1, pageSize: BLOQUES_PAGE_SIZE, seccionId: seccion.id }),
      staleTime: 15_000,
    })),
  })

  const arbol: readonly SeccionConBloques[] = useMemo(() => {
    return secciones.map((seccion, i) => ({
      seccion,
      bloques: [...(bloquesQueries[i]?.data?.data ?? [])].sort((a, b) => a.orden - b.orden),
    }))
  }, [secciones, bloquesQueries])

  const totalBloques = useMemo(
    () => arbol.reduce((acc, item) => acc + item.bloques.length, 0),
    [arbol],
  )

  const bloquesLoading = bloquesQueries.some((q) => q.isLoading)

  return {
    modulo: moduloQuery.data,
    arbol,
    totalSecciones: secciones.length,
    totalBloques,
    isLoading: moduloQuery.isLoading || seccionesQuery.isLoading || bloquesLoading,
    isError: Boolean(moduloQuery.error),
  }
}
