import type { ListarUsuariosQuery } from "@nexott-learn/shared-types"
import { useEffect, useMemo, useState } from "react"

export type FiltroRol = "all" | "ADMIN" | "PARTICIPANTE"
export type FiltroEstado = "all" | "ACTIVO" | "BLOQUEADO"

const DEBOUNCE_MS = 250

export interface FiltrosUsuariosState {
  readonly busquedaInput: string
  readonly setBusquedaInput: (value: string) => void
  readonly rol: FiltroRol
  readonly setRol: (value: FiltroRol) => void
  readonly estado: FiltroEstado
  readonly setEstado: (value: FiltroEstado) => void
  readonly query: Partial<ListarUsuariosQuery>
  readonly hasActiveFilters: boolean
  readonly clear: () => void
}

export function useFiltrosUsuarios(): FiltrosUsuariosState {
  const [busquedaInput, setBusquedaInput] = useState("")
  const [busquedaDebounced, setBusquedaDebounced] = useState("")
  const [rol, setRol] = useState<FiltroRol>("all")
  const [estado, setEstado] = useState<FiltroEstado>("all")

  useEffect(() => {
    const t = window.setTimeout(() => setBusquedaDebounced(busquedaInput.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [busquedaInput])

  const query = useMemo<Partial<ListarUsuariosQuery>>(() => {
    const out: Partial<ListarUsuariosQuery> = {}
    if (busquedaDebounced) {
      out.q = busquedaDebounced
    }
    if (rol !== "all") {
      out.rol = rol
    }
    if (estado !== "all") {
      out.estado = estado
    }
    return out
  }, [busquedaDebounced, rol, estado])

  const hasActiveFilters = busquedaDebounced.length > 0 || rol !== "all" || estado !== "all"

  return {
    busquedaInput,
    setBusquedaInput,
    rol,
    setRol,
    estado,
    setEstado,
    query,
    hasActiveFilters,
    clear: () => {
      setBusquedaInput("")
      setRol("all")
      setEstado("all")
    },
  }
}
