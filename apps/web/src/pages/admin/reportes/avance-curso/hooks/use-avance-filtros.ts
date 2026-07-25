import type { AvanceCursoQuery, RolAvanceFiltro } from "@nexott-learn/shared-types"
import { useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { parsearEstado, parsearRol } from "../avance-curso.filtros"
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

function construirQuery(
  cursoId: string,
  vista: VistaAvance,
  rol: RolAvanceFiltro,
  estado: string,
  busqueda: string,
  page: number,
): AvanceCursoQuery | null {
  if (!cursoId) {
    return null
  }
  return {
    cursoId,
    vista,
    rol,
    ...(estado ? { estado } : {}),
    ...(busqueda ? { busqueda } : {}),
    page,
    pageSize: PAGE_SIZE,
    format: "json",
  }
}

// Escribe `valor` en `clave` (o lo borra si viene vacio, para no ensuciar la URL
// compartible) y vuelve a la primera pagina: todo cambio de filtro repagina.
function aplicarFiltro(next: URLSearchParams, clave: string, valor: string): void {
  if (valor) {
    next.set(clave, valor)
  } else {
    next.delete(clave)
  }
  next.set("page", "1")
}

export interface AvanceFiltrosEstado {
  readonly cursoId: string
  readonly vista: VistaAvance
  readonly page: number
  readonly rol: RolAvanceFiltro
  readonly estado: string
  readonly busqueda: string
  readonly query: AvanceCursoQuery | null
  readonly actualizarParam: (clave: string, valor: string) => void
  readonly actualizarRol: (rol: RolAvanceFiltro) => void
  readonly actualizarEstado: (valor: string) => void
  readonly actualizarBusqueda: (valor: string) => void
}

/**
 * Encapsula el estado del reporte de avance en la URL (shareable): curso,
 * vista, pagina y filtros (rol/estado/busqueda). Devuelve tambien el `query`
 * listo para `useAvanceCurso` y los setters.
 */
export function useAvanceFiltros(cursos: readonly CursoOpcion[]): AvanceFiltrosEstado {
  const [searchParams, setSearchParams] = useSearchParams()

  const cursoIdParam = searchParams.get("cursoId")
  const cursoId = cursoIdParam ?? cursos[0]?.id ?? ""
  const vista = parsearVista(searchParams.get("vista"))
  const page = parsearPage(searchParams.get("page"))
  const rol = parsearRol(searchParams.get("rol"))
  const estado = parsearEstado(searchParams.get("estado"), rol)
  const busqueda = searchParams.get("busqueda") ?? ""

  // Si no hay cursoId en la URL y ya hay cursos, fijamos el primero (shareable).
  useEffect(() => {
    const primero = cursos[0]
    if (!cursoIdParam && primero) {
      const next = new URLSearchParams(searchParams)
      next.set("cursoId", primero.id)
      setSearchParams(next, { replace: true })
    }
  }, [cursoIdParam, cursos, searchParams, setSearchParams])

  const query = useMemo<AvanceCursoQuery | null>(
    () => construirQuery(cursoId, vista, rol, estado, busqueda, page),
    [cursoId, vista, rol, estado, busqueda, page],
  )

  // Identidad estable: `SearchField` usa los setters en su debounce; una
  // identidad cambiante reiniciaria el timer en cada re-render.
  const mutarParams = useCallback(
    (mutar: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams)
      mutar(next)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const actualizarParam = useCallback(
    (clave: string, valor: string) =>
      mutarParams((next) => {
        next.set(clave, valor)
        if (clave !== "page") {
          next.set("page", "1")
        }
      }),
    [mutarParams],
  )
  // Al cambiar el rol limpiamos el estado: el enum valido depende del rol (APTO
  // no aplica a voluntario), asi no arrastramos un filtro que no matchea nada.
  const actualizarRol = useCallback(
    (nuevoRol: RolAvanceFiltro) =>
      mutarParams((next) => {
        next.set("rol", nuevoRol)
        next.delete("estado")
        next.set("page", "1")
      }),
    [mutarParams],
  )

  const actualizarEstado = useCallback(
    (valor: string) => mutarParams((next) => aplicarFiltro(next, "estado", valor)),
    [mutarParams],
  )
  const actualizarBusqueda = useCallback(
    (valor: string) => mutarParams((next) => aplicarFiltro(next, "busqueda", valor)),
    [mutarParams],
  )

  return {
    cursoId,
    vista,
    page,
    rol,
    estado,
    busqueda,
    query,
    actualizarParam,
    actualizarRol,
    actualizarEstado,
    actualizarBusqueda,
  }
}
