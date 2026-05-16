import type {
  EstadoAsignado,
  EstadoCurso,
  EstadoVoluntario,
  MeCursoResumen,
  RolAsignacion,
} from "@nexott-learn/shared-types"

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

export const TAMANO_PAGINA = 24

export type SlugEstadoCurso =
  | "pendiente"
  | "progreso"
  | "solido"
  | "apto"
  | "no-apto"
  | "completado"

export interface TonoEstadoCurso {
  readonly slug: SlugEstadoCurso
  readonly etiqueta: string
}

const MAPEO_ASIGNADO: ReadonlyMap<EstadoAsignado, TonoEstadoCurso> = new Map([
  ["ASIGNADO", { slug: "pendiente", etiqueta: "Asignado" }],
  ["EN_PROGRESO", { slug: "progreso", etiqueta: "En progreso" }],
  ["LISTO", { slug: "solido", etiqueta: "Listo" }],
  ["APTO", { slug: "apto", etiqueta: "Apto" }],
  ["NO_APTO", { slug: "no-apto", etiqueta: "No apto" }],
  ["RETIRADO", { slug: "pendiente", etiqueta: "Retirado" }],
])

const MAPEO_VOLUNTARIO: ReadonlyMap<EstadoVoluntario, TonoEstadoCurso> = new Map([
  ["INSCRITO", { slug: "pendiente", etiqueta: "Inscrito" }],
  ["EN_PROGRESO", { slug: "progreso", etiqueta: "En progreso" }],
  ["LISTO", { slug: "solido", etiqueta: "Listo" }],
  ["COMPLETADO", { slug: "completado", etiqueta: "Completado" }],
  ["RETIRADO", { slug: "pendiente", etiqueta: "Retirado" }],
])

const TONO_FALLBACK: TonoEstadoCurso = { slug: "pendiente", etiqueta: "—" }

export function tonoEstado(curso: MeCursoResumen): TonoEstadoCurso {
  if (curso.rol === "VOLUNTARIO") {
    return curso.estadoVoluntario
      ? (MAPEO_VOLUNTARIO.get(curso.estadoVoluntario) ?? TONO_FALLBACK)
      : TONO_FALLBACK
  }
  return curso.estadoAsignado
    ? (MAPEO_ASIGNADO.get(curso.estadoAsignado) ?? TONO_FALLBACK)
    : TONO_FALLBACK
}
