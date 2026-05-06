import type { AreaColor, AreaCompetenciaItem } from "@nexott-learn/shared-types"

// Subset de colores validos del DS. Mantener sincronizado con areaColorSchema
// en packages/shared-types/src/admin-modulos.ts.
const AREA_COLORS_VALIDOS: readonly AreaColor[] = [
  "indigo",
  "emerald",
  "violet",
  "amber",
  "rose",
  "cyan",
  "slate",
] as const

/**
 * Normaliza el campo `color` que viene de la BD al subset que entiende el DS.
 * Si la BD trae null o un valor fuera del set, devuelve "slate" (fallback neutro).
 *
 * Funcion exportada para que el modulo `modulos` la reuse al mapear
 * `area.color` en cada item de la lista (single source of truth).
 */
export function mapAreaColorAUI(colorBd: string | null | undefined): AreaColor {
  if (!colorBd) {
    return "slate"
  }
  return (AREA_COLORS_VALIDOS as readonly string[]).includes(colorBd)
    ? (colorBd as AreaColor)
    : "slate"
}

// Forma minima del registro Prisma necesaria para mapear un area de competencia.
export type AreaCompetenciaRow = {
  id: string
  nombre: string
  descripcion: string | null
  color: string | null
  orden: number | null
}

/**
 * Convierte una fila Prisma de AreaCompetencia al item que consume el frontend.
 * Funcion pura, sin efectos.
 */
export function mapAreaAItem(row: AreaCompetenciaRow): AreaCompetenciaItem {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? undefined,
    color: mapAreaColorAUI(row.color),
    orden: row.orden,
  }
}
