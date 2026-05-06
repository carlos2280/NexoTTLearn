import type { Area, AreaConContadores } from "@nexott-learn/shared-types"
import type { Prisma } from "@prisma/client"

// Selección compartida entre listado, lectura y mutaciones. El service la
// reusa para que las firmas internas y el snapshot del LogActividad se basen
// siempre en la misma forma de fila.
export const AREA_SELECT = {
  id: true,
  nombre: true,
  color: true,
  descripcion: true,
  orden: true,
  estado: true,
  obsoletaAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AreaSelect

export type AreaRow = Prisma.AreaGetPayload<{ select: typeof AREA_SELECT }>

export type AreaConContadoresRow = Prisma.AreaGetPayload<{
  select: typeof AREA_SELECT & {
    _count: { select: { cursoAreas: true; modulos: true } }
  }
}>

export function mapAreaToDto(row: AreaRow): Area {
  return {
    id: row.id,
    nombre: row.nombre,
    color: row.color,
    descripcion: row.descripcion,
    orden: row.orden,
    estado: row.estado,
    obsoletaAt: row.obsoletaAt ? row.obsoletaAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapAreaWithCountToDto(row: AreaConContadoresRow): AreaConContadores {
  return {
    ...mapAreaToDto(row),
    _count: {
      cursoAreas: row._count.cursoAreas,
      modulos: row._count.modulos,
    },
  }
}
