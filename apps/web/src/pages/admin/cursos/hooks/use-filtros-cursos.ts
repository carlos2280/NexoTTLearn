import type { FiltroEstadoCurso, ListarCursosQuery } from "@nexott-learn/shared-types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"

const VIEW_STORAGE_KEY = "nx-cursos-vista"
const DEFAULT_PAGE_SIZE = 24

export type VistaCursos = "cards" | "table"

interface FiltrosCursosResult {
  readonly busquedaInput: string
  readonly setBusquedaInput: (value: string) => void
  readonly estado: FiltroEstadoCurso
  readonly setEstado: (value: FiltroEstadoCurso) => void
  readonly page: number
  readonly setPage: (page: number) => void
  readonly view: VistaCursos
  readonly setView: (view: VistaCursos) => void
  readonly hasActiveFilters: boolean
  readonly clear: () => void
  readonly query: Partial<ListarCursosQuery>
}

function loadView(): VistaCursos {
  if (typeof window === "undefined") {
    return "cards"
  }
  const stored = window.localStorage.getItem(VIEW_STORAGE_KEY)
  return stored === "table" ? "table" : "cards"
}

export function useFiltrosCursos(): FiltrosCursosResult {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialBusqueda = searchParams.get("q") ?? ""
  const initialEstadoParam = searchParams.get("estado") as FiltroEstadoCurso | null
  const initialEstado: FiltroEstadoCurso = initialEstadoParam ?? "all"
  const initialPage = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1

  const [busquedaInput, setBusquedaInputState] = useState(initialBusqueda)
  const [busquedaActiva, setBusquedaActiva] = useState(initialBusqueda)
  const [estado, setEstadoState] = useState<FiltroEstadoCurso>(initialEstado)
  const [page, setPageState] = useState(initialPage)
  const [view, setViewState] = useState<VistaCursos>(loadView)

  // Debounce de la busqueda → 280ms.
  const debounceRef = useRef<number | null>(null)
  const setBusquedaInput = useCallback((value: string) => {
    setBusquedaInputState(value)
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }
    debounceRef.current = window.setTimeout(() => {
      setBusquedaActiva(value)
      setPageState(1)
    }, 280)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const setEstado = useCallback((value: FiltroEstadoCurso) => {
    setEstadoState(value)
    setPageState(1)
  }, [])

  const setPage = useCallback((next: number) => {
    setPageState(Math.max(1, next))
  }, [])

  const setView = useCallback((next: VistaCursos) => {
    setViewState(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next)
    }
  }, [])

  // Sincroniza URL con la busqueda activa, estado y page.
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (busquedaActiva) {
      next.set("q", busquedaActiva)
    } else {
      next.delete("q")
    }
    if (estado !== "all") {
      next.set("estado", estado)
    } else {
      next.delete("estado")
    }
    if (page > 1) {
      next.set("page", String(page))
    } else {
      next.delete("page")
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [busquedaActiva, estado, page, searchParams, setSearchParams])

  const hasActiveFilters = busquedaActiva.trim().length > 0 || estado !== "all"

  const clear = useCallback(() => {
    setBusquedaInputState("")
    setBusquedaActiva("")
    setEstadoState("all")
    setPageState(1)
  }, [])

  const query = useMemo<Partial<ListarCursosQuery>>(() => {
    const base: Partial<ListarCursosQuery> = {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }
    const trimmed = busquedaActiva.trim()
    if (trimmed.length > 0) {
      base.q = trimmed
    }
    if (estado !== "all") {
      base.estado = estado
    }
    return base
  }, [busquedaActiva, estado, page])

  return {
    busquedaInput,
    setBusquedaInput,
    estado,
    setEstado,
    page,
    setPage,
    view,
    setView,
    hasActiveFilters,
    clear,
    query,
  }
}
