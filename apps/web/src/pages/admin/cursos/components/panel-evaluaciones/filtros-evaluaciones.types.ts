export type FiltroEstadoUi =
  | "TODOS"
  | "EN_PROGRESO"
  | "FINALIZADO"
  | "ANULADO"
  | "EN_EVALUACION"
  | "EVALUADO"
  // Solo lo usa la tabla del transversal (repo inaccesible, B2c).
  | "FALLO_ACCESO_REPO"

export type FiltroAprobadoUi = "TODOS" | "SI" | "NO" | "PENDIENTE"

export interface OpcionEstado {
  readonly value: FiltroEstadoUi
  readonly etiqueta: string
}

export interface FiltrosEvaluacionesValor {
  readonly busqueda: string
  readonly estado: FiltroEstadoUi
  readonly aprobado: FiltroAprobadoUi
}

export const FILTROS_EVALUACIONES_INICIAL: FiltrosEvaluacionesValor = {
  busqueda: "",
  estado: "TODOS",
  aprobado: "TODOS",
}
