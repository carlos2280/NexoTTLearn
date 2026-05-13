import { useListarBloques } from "@/features/catalogo/hooks/use-listar-bloques"
import { useListarSecciones } from "@/features/catalogo/hooks/use-listar-secciones"
import { useObtenerModulo } from "@/features/catalogo/hooks/use-obtener-modulo"
import { useMemo } from "react"
import type { SeccionConBloques } from "../types"

const PAGE_SIZE = 200

/**
 * Carga el modulo, sus secciones y todos sus bloques, y los agrupa para el
 * arbol del builder.
 *
 * NOTA: hoy obtenemos los bloques sin filtrar por seccion y los agrupamos en
 * cliente. Para datasets grandes habria que pedir bloques por seccion (N
 * queries con useQueries) o un endpoint agregado en el back. Suficiente para
 * el modo mock + prototipo inicial.
 */
export function useBuilderDatos(moduloId: string | undefined) {
  const moduloQuery = useObtenerModulo(moduloId)
  const seccionesQuery = useListarSecciones({ page: 1, pageSize: PAGE_SIZE, moduloId })
  const bloquesQuery = useListarBloques({ page: 1, pageSize: PAGE_SIZE })

  const secciones = useMemo(
    () => [...(seccionesQuery.data?.data ?? [])].sort((a, b) => a.orden - b.orden),
    [seccionesQuery.data],
  )

  const arbol: readonly SeccionConBloques[] = useMemo(() => {
    if (secciones.length === 0) {
      return []
    }
    const todosBloques = bloquesQuery.data?.data ?? []
    return secciones.map((seccion) => ({
      seccion,
      bloques: todosBloques
        .filter((b) => b.seccionId === seccion.id)
        .sort((a, b) => a.orden - b.orden),
    }))
  }, [secciones, bloquesQuery.data])

  const totalBloques = useMemo(
    () => arbol.reduce((acc, item) => acc + item.bloques.length, 0),
    [arbol],
  )

  return {
    modulo: moduloQuery.data,
    arbol,
    totalSecciones: secciones.length,
    totalBloques,
    isLoading: moduloQuery.isLoading || seccionesQuery.isLoading || bloquesQuery.isLoading,
    isError: Boolean(moduloQuery.error),
  }
}
