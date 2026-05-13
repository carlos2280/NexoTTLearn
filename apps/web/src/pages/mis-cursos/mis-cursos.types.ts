import type { EstadoCurso, RolAsignacion } from "@nexott-learn/shared-types"

export type FiltroEstadoCurso = EstadoCurso | "TODOS"
export type FiltroRolAsignacion = RolAsignacion | "TODOS"

export interface FiltrosMisCursos {
  readonly estado: FiltroEstadoCurso
  readonly rol: FiltroRolAsignacion
  readonly page: number
}

export const FILTROS_INICIALES: FiltrosMisCursos = {
  estado: "TODOS",
  rol: "TODOS",
  page: 1,
}

export const TAMANO_PAGINA = 10
