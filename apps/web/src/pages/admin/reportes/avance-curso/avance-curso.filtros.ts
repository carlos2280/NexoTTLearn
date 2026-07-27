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

// El catalogo de estados de la asignacion vive en
// `@/features/asignaciones/lib/estados-filtro`: lo comparte con la pestana de
// colaboradores del curso. Este modulo solo conserva el filtro de ROL, que si
// es propio del reporte.
