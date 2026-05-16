import { useCallback, useState } from "react"
import {
  FILTROS_INICIALES,
  type FiltroEstadoCurso,
  type FiltroRolAsignacion,
  type FiltrosMisCursos,
} from "../mis-cursos.types"

interface UseFiltrosMisCursosResult {
  readonly filtros: FiltrosMisCursos
  readonly setEstado: (estado: FiltroEstadoCurso) => void
  readonly setRol: (rol: FiltroRolAsignacion) => void
  readonly setPage: (page: number) => void
}

export function useFiltrosMisCursos(): UseFiltrosMisCursosResult {
  const [filtros, setFiltros] = useState<FiltrosMisCursos>(FILTROS_INICIALES)

  const setEstado = useCallback((estado: FiltroEstadoCurso) => {
    setFiltros((prev) => ({ ...prev, estado, page: 1 }))
  }, [])

  const setRol = useCallback((rol: FiltroRolAsignacion) => {
    setFiltros((prev) => ({ ...prev, rol, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFiltros((prev) => ({ ...prev, page }))
  }, [])

  return { filtros, setEstado, setRol, setPage }
}
