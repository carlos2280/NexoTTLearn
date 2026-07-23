import type { AvanceCursoQuery, RolAvanceFiltro } from "@nexott-learn/shared-types"
import { useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { parsearRol } from "../avance-curso.filtros"
import type { CursoOpcion, VistaAvance } from "../avance-curso.types"

const VISTAS_VALIDAS: readonly VistaAvance[] = ["ACTUAL", "FOTOGRAFIA_CIERRE", "HISTORICO"]
const PAGE_SIZE = 20

function parsearVista(raw: string | null): VistaAvance {
  return VISTAS_VALIDAS.includes(raw as VistaAvance) ? (raw as VistaAvance) : "ACTUAL"
}

// Un `?page=abc` (URL compartida o editada a mano) cae a 1 en vez de mandar
// NaN al API y provocar un 422.
function parsearPage(raw: string | null): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

export interface AvanceFiltrosEstado {
  readonly cursoId: string
  readonly vista: VistaAvance
  readonly page: number
  readonly rol: RolAvanceFiltro
  readonly busqueda: string
  readonly query: AvanceCursoQuery | null
  readonly actualizarParam: (clave: string, valor: string) => void
  readonly actualizarBusqueda: (valor: string) => void
}

/**
 * Encapsula el estado del reporte de avance en la URL (shareable): curso,
 * vista, pagina y filtros (rol/busqueda). Devuelve tambien el `query` listo
 * para `useAvanceCurso` y los setters. Mantiene la pagina en el componente
 * simple (fuera del limite de complejidad cognitiva).
 */
export function useAvanceFiltros(cursos: readonly CursoOpcion[]): AvanceFiltrosEstado {
  const [searchParams, setSearchParams] = useSearchParams()

  const cursoIdParam = searchParams.get("cursoId")
  const cursoId = cursoIdParam ?? cursos[0]?.id ?? ""
  const vista = parsearVista(searchParams.get("vista"))
  const page = parsearPage(searchParams.get("page"))
  const rol = parsearRol(searchParams.get("rol"))
  const busqueda = searchParams.get("busqueda") ?? ""

  // Si no hay cursoId en la URL y ya hay cursos, fijamos el primero para que el
  // estado sea shareable y consistente con la UI.
  useEffect(() => {
    const primero = cursos[0]
    if (!cursoIdParam && primero) {
      const next = new URLSearchParams(searchParams)
      next.set("cursoId", primero.id)
      setSearchParams(next, { replace: true })
    }
  }, [cursoIdParam, cursos, searchParams, setSearchParams])

  const query = useMemo<AvanceCursoQuery | null>(() => {
    if (!cursoId) {
      return null
    }
    return {
      cursoId,
      vista,
      rol,
      ...(busqueda ? { busqueda } : {}),
      page,
      pageSize: PAGE_SIZE,
      format: "json",
    }
  }, [cursoId, vista, rol, busqueda, page])

  // useCallback: `SearchField` usa `actualizarBusqueda` en su effect de debounce;
  // una identidad estable evita resetear el timer en re-renders del padre.
  const actualizarParam = useCallback(
    (clave: string, valor: string) => {
      const next = new URLSearchParams(searchParams)
      next.set(clave, valor)
      if (clave !== "page") {
        next.set("page", "1")
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  // La busqueda vacia se borra de la URL (no ensucia el estado shareable).
  const actualizarBusqueda = useCallback(
    (valor: string) => {
      const next = new URLSearchParams(searchParams)
      if (valor) {
        next.set("busqueda", valor)
      } else {
        next.delete("busqueda")
      }
      next.set("page", "1")
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  return { cursoId, vista, page, rol, busqueda, query, actualizarParam, actualizarBusqueda }
}
