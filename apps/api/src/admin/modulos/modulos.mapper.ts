import type { ModuloAdminItem } from "@nexott-learn/shared-types"
import type { EstadoModulo } from "@prisma/client"
import { mapAreaColorAUI } from "../areas-competencia/areas-competencia.mapper"

// Forma minima del registro Prisma necesaria para construir un ModuloAdminItem.
// Tipar la entrada asi (en lugar del modelo Modulo completo) deja claro que
// selects son requeridos en el service y previene leer campos no incluidos.
export type ModuloAdminRow = {
  id: string
  cursoId: string
  titulo: string
  slug: string
  descripcion: string | null
  orden: number
  estado: EstadoModulo
  duracionEstimada: number | null
  peso: number | null
  puntajeObjetivo: number | null
  area: {
    id: string
    nombre: string
    color: string | null
  } | null
  _count: {
    secciones: number
  }
  secciones: ReadonlyArray<{
    _count: {
      contenidos: number
    }
  }>
}

/**
 * Convierte una fila Prisma de Modulo (con counts y area embebida) en el item
 * que consume el frontend. Funcion pura, sin efectos.
 *
 * `contentsCount` se calcula como suma de `secciones[]._count.contenidos`
 * usando reduce (regla de estilo del repo: nada de bucles imperativos).
 */
export function mapModuloAItem(row: ModuloAdminRow): ModuloAdminItem {
  return {
    id: row.id,
    cursoId: row.cursoId,
    titulo: row.titulo,
    slug: row.slug,
    descripcion: row.descripcion ?? undefined,
    orden: row.orden,
    estado: row.estado,
    duracionEstimada: row.duracionEstimada,
    peso: row.peso,
    puntajeObjetivo: row.puntajeObjetivo,
    area: row.area
      ? {
          id: row.area.id,
          nombre: row.area.nombre,
          color: mapAreaColorAUI(row.area.color),
        }
      : null,
    sectionsCount: row._count.secciones,
    contentsCount: row.secciones.reduce((acc, s) => acc + s._count.contenidos, 0),
  }
}

/**
 * Suma los pesos definidos de una lista de modulos. Si TODOS los pesos son null,
 * devuelve null para que el frontend pueda mostrar "Sin definir" en el chip
 * "Peso total". En cualquier otro caso devuelve la suma como numero.
 */
export function calcularPesoTotal(items: readonly ModuloAdminItem[]): number | null {
  const definidos = items.filter((i): i is ModuloAdminItem & { peso: number } => i.peso !== null)
  if (definidos.length === 0) {
    return null
  }
  return definidos.reduce((acc, i) => acc + i.peso, 0)
}
