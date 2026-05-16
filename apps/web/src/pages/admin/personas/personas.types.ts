import type { EstadoEmpleado } from "@nexott-learn/shared-types"

export type FiltroRol = "TODOS" | "ADMIN" | "PARTICIPANTE"
export type FiltroEstadoEmpleado = "TODOS" | EstadoEmpleado
export type FiltroBloqueado = "TODOS" | "SI" | "NO"

export interface FiltrosPersonas {
  readonly busqueda: string
  readonly rol: FiltroRol
  readonly estadoEmpleado: FiltroEstadoEmpleado
  readonly bloqueado: FiltroBloqueado
}

export const FILTROS_PERSONAS_INICIAL: FiltrosPersonas = {
  busqueda: "",
  rol: "TODOS",
  estadoEmpleado: "TODOS",
  bloqueado: "TODOS",
}
