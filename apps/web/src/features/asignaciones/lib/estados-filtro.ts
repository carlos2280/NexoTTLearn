import type { EstadoAsignado, EstadoVoluntario } from "@nexott-learn/shared-types"

/** Cualquier estado real de la asignacion, sea del enum de asignado o de voluntario. */
export type EstadoAsignacion = EstadoAsignado | EstadoVoluntario

export interface EstadoFiltroOpcion {
  readonly id: string
  readonly etiqueta: string
}

/** Rol por el que se puede acotar el listado, o TODOS para no acotar. */
export type RolFiltro = "ASIGNADO" | "VOLUNTARIO" | "TODOS"

// Estados reales de cada enum del backend (EstadoAsignado / EstadoVoluntario).
// El conjunto valido depende del rol: un asignado nunca esta "INSCRITO" ni
// "COMPLETADO", un voluntario nunca esta "APTO" ni "NO_APTO".
const ESTADOS_ASIGNADO: readonly EstadoFiltroOpcion[] = [
  // "Sin iniciar" (no "Asignado") para no confundirse con el filtro de rol.
  { id: "ASIGNADO", etiqueta: "Sin iniciar" },
  { id: "EN_PROGRESO", etiqueta: "En progreso" },
  { id: "LISTO", etiqueta: "Listo" },
  { id: "APTO", etiqueta: "Apto" },
  { id: "NO_APTO", etiqueta: "No apto" },
  { id: "RETIRADO", etiqueta: "Retirado" },
]

const ESTADOS_VOLUNTARIO: readonly EstadoFiltroOpcion[] = [
  { id: "INSCRITO", etiqueta: "Inscrito" },
  { id: "EN_PROGRESO", etiqueta: "En progreso" },
  { id: "LISTO", etiqueta: "Listo" },
  { id: "COMPLETADO", etiqueta: "Completado" },
  { id: "RETIRADO", etiqueta: "Retirado" },
]

/**
 * Estados que se pueden filtrar segun el rol elegido. Para `TODOS` devuelve la
 * union de ambos enums sin duplicar (EN_PROGRESO/LISTO/RETIRADO viven en los
 * dos). El backend traduce cada valor al enum correcto (`buildFiltroEstado`).
 *
 * Vive en `features/` y no en una page porque lo consumen dos pantallas: el
 * reporte de avance por curso y la pestana de colaboradores del curso.
 */
export function estadosDisponibles(rol: RolFiltro): readonly EstadoFiltroOpcion[] {
  if (rol === "ASIGNADO") {
    return ESTADOS_ASIGNADO
  }
  if (rol === "VOLUNTARIO") {
    return ESTADOS_VOLUNTARIO
  }
  const vistos = new Set<string>()
  const union: EstadoFiltroOpcion[] = []
  for (const opcion of [...ESTADOS_ASIGNADO, ...ESTADOS_VOLUNTARIO]) {
    if (!vistos.has(opcion.id)) {
      vistos.add(opcion.id)
      union.push(opcion)
    }
  }
  return union
}

/**
 * Normaliza un valor de `estado` que viene de fuera (URL o estado local).
 * Devuelve "" (sin filtro de estado) si esta ausente o si no pertenece al
 * conjunto valido del rol actual: asi al cambiar de rol no arrastramos un
 * estado que no aplica (p. ej. APTO en voluntario) y evitamos una tabla vacia
 * confusa.
 */
export function parsearEstado(raw: string | null, rol: RolFiltro): string {
  if (!raw) {
    return ""
  }
  return estadosDisponibles(rol).some((e) => e.id === raw) ? raw : ""
}

/**
 * Valor especial del selector de estado: "activos" no es un estado del enum,
 * es la ausencia de filtro MAS el ocultamiento de los retirados (el default).
 * `TODOS` es la ausencia de filtro incluyendo retirados.
 */
export const ESTADO_ACTIVOS = "ACTIVOS"
export const ESTADO_TODOS = "TODOS"

export interface FiltroEstadoResuelto {
  /** Estado concreto del enum, o `undefined` si no se acota por estado. */
  readonly estado: EstadoAsignacion | undefined
  readonly incluirRetirados: boolean
}

const IDS_ESTADO_REAL = new Set<string>(
  [...ESTADOS_ASIGNADO, ...ESTADOS_VOLUNTARIO].map((o) => o.id),
)

function esEstadoAsignacion(valor: string): valor is EstadoAsignacion {
  return IDS_ESTADO_REAL.has(valor)
}

/**
 * Traduce lo elegido en el selector a los dos parametros que entiende el
 * backend. Pedir explicitamente "Retirado" tiene que ganarle al ocultamiento
 * por defecto, si no ese filtro devolveria siempre una tabla vacia.
 */
export function resolverFiltroEstado(seleccion: string): FiltroEstadoResuelto {
  if (seleccion === ESTADO_TODOS) {
    return { estado: undefined, incluirRetirados: true }
  }
  if (esEstadoAsignacion(seleccion)) {
    return { estado: seleccion, incluirRetirados: true }
  }
  // ACTIVOS, "" o cualquier valor desconocido: el default seguro.
  return { estado: undefined, incluirRetirados: false }
}

/**
 * Opciones completas del selector, con los dos valores especiales alrededor de
 * los estados reales del rol.
 */
export function opcionesSelectorEstado(rol: RolFiltro): readonly EstadoFiltroOpcion[] {
  return [
    { id: ESTADO_ACTIVOS, etiqueta: "Activos" },
    ...estadosDisponibles(rol),
    { id: ESTADO_TODOS, etiqueta: "Todos (con retirados)" },
  ]
}

/**
 * Self-heal al cambiar de rol: si la seleccion actual no existe en el rol
 * nuevo (p. ej. APTO al pasar a voluntarios) cae a "Activos" en vez de dejar
 * una tabla vacia que parece un error.
 */
export function parsearSeleccionEstado(seleccion: string, rol: RolFiltro): string {
  if (seleccion === ESTADO_ACTIVOS || seleccion === ESTADO_TODOS) {
    return seleccion
  }
  return parsearEstado(seleccion, rol) || ESTADO_ACTIVOS
}
