import type { RolAvanceFiltro } from "@nexott-learn/shared-types"

export interface RolFiltroOpcion {
  readonly id: RolAvanceFiltro
  readonly etiqueta: string
}

/**
 * Opciones del filtro por rol del reporte de avance. `ASIGNADO` va primero: es
 * el default (el reporte operativo se centra en los asignados, los que van al
 * veredicto APTO). `TODOS` no filtra.
 */
export const ROLES_FILTRO: readonly RolFiltroOpcion[] = [
  { id: "ASIGNADO", etiqueta: "Asignados" },
  { id: "VOLUNTARIO", etiqueta: "Voluntarios" },
  { id: "TODOS", etiqueta: "Todos" },
]

const ROLES_VALIDOS: readonly RolAvanceFiltro[] = ["ASIGNADO", "VOLUNTARIO", "TODOS"]

/**
 * Normaliza el parametro `rol` de la URL a un valor valido. Cualquier valor
 * ausente o desconocido cae a `ASIGNADO` (default del reporte).
 */
export function parsearRol(raw: string | null): RolAvanceFiltro {
  return ROLES_VALIDOS.includes(raw as RolAvanceFiltro) ? (raw as RolAvanceFiltro) : "ASIGNADO"
}

/**
 * Etiqueta corta del rol para el chip de cada fila. El voluntario se mide sobre
 * el catalogo completo (no sobre un plan), por eso conviene distinguirlo.
 */
export function etiquetaRolFila(rol: "ASIGNADO" | "VOLUNTARIO"): string {
  return rol === "VOLUNTARIO" ? "Voluntario" : "Asignado"
}

// ---------------------------------------------------------------------------
// Filtro por estado de la asignacion
// ---------------------------------------------------------------------------

export interface EstadoFiltroOpcion {
  readonly id: string
  readonly etiqueta: string
}

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
 */
export function estadosDisponibles(rol: RolAvanceFiltro): readonly EstadoFiltroOpcion[] {
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
 * Normaliza el parametro `estado` de la URL. Devuelve "" (todos los estados)
 * si esta ausente o si no pertenece al conjunto valido del rol actual: asi al
 * cambiar de rol no arrastramos un estado que no aplica (p. ej. APTO en
 * voluntario) y evitamos una tabla vacia confusa.
 */
export function parsearEstado(raw: string | null, rol: RolAvanceFiltro): string {
  if (!raw) {
    return ""
  }
  return estadosDisponibles(rol).some((e) => e.id === raw) ? raw : ""
}
