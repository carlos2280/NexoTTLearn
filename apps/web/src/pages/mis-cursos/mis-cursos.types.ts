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

export type SlugEstadoCurso = "pendiente" | "progreso" | "solido" | "en-desarrollo" | "completado"

export interface TonoEstadoCurso {
  readonly slug: SlugEstadoCurso
  readonly etiqueta: string
}

/**
 * Mapeo "lenguaje motivacional" (08-D-07 extendido a /mis-cursos).
 * Fuera de la ceremonia de cierre el participante nunca lee "APTO"/"NO APTO"
 * gritado: el resultado se humaniza con verbo en pasado o estado del camino.
 * Sin rojo dramatico, sin verde celebrativo — color discreto que acompaña.
 */
const MAPEO_ASIGNADO: ReadonlyMap<EstadoAsignado, TonoEstadoCurso> = new Map([
  ["ASIGNADO", { slug: "pendiente", etiqueta: "Por empezar" }],
  ["EN_PROGRESO", { slug: "progreso", etiqueta: "En progreso" }],
  ["LISTO", { slug: "solido", etiqueta: "Listo para evaluar" }],
  ["APTO", { slug: "solido", etiqueta: "Logrado" }],
  ["NO_APTO", { slug: "en-desarrollo", etiqueta: "Por reforzar" }],
  ["RETIRADO", { slug: "pendiente", etiqueta: "Retirado" }],
])

const MAPEO_VOLUNTARIO: ReadonlyMap<EstadoVoluntario, TonoEstadoCurso> = new Map([
  ["INSCRITO", { slug: "pendiente", etiqueta: "Inscrito" }],
  ["EN_PROGRESO", { slug: "progreso", etiqueta: "En progreso" }],
  ["LISTO", { slug: "solido", etiqueta: "Listo para evaluar" }],
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

/**
 * Curso cerrado = el camino del participante en este curso ya termino.
 * En esos casos la deadline deja de ser informacion operativa (es historico)
 * y mostrarla en rojo como "vencido hace X dias" es castigador: el
 * participante cumplio (o se retiro), no hay nada que reclamar.
 */
const ESTADOS_ASIGNADO_CERRADOS: ReadonlySet<EstadoAsignado> = new Set<EstadoAsignado>([
  "APTO",
  "NO_APTO",
  "RETIRADO",
])

const ESTADOS_VOLUNTARIO_CERRADOS: ReadonlySet<EstadoVoluntario> = new Set<EstadoVoluntario>([
  "COMPLETADO",
  "RETIRADO",
])

export function estaCerrado(curso: MeCursoResumen): boolean {
  if (curso.rol === "VOLUNTARIO") {
    return curso.estadoVoluntario ? ESTADOS_VOLUNTARIO_CERRADOS.has(curso.estadoVoluntario) : false
  }
  return curso.estadoAsignado ? ESTADOS_ASIGNADO_CERRADOS.has(curso.estadoAsignado) : false
}
