import type { EvaluacionInicialDetalleAdmin } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"

// =============================================================================
// EVALUACION INICIAL DETALLE SELECT + MAPPER
// MAESTRO §7.2 · campo puntaje es Int (no Decimal). Una nota por (inscripcion, area).
// =============================================================================

export const EVALUACION_INICIAL_DETALLE_SELECT = {
  id: true,
  inscripcionId: true,
  areaId: true,
  puntaje: true,
  observaciones: true,
  capturadaPorId: true,
  capturadaAt: true,
  updatedAt: true,
  area: {
    select: { nombre: true },
  },
} satisfies Prisma.EvaluacionInicialSelect

export type EvaluacionInicialDetalleRow = Prisma.EvaluacionInicialGetPayload<{
  select: typeof EVALUACION_INICIAL_DETALLE_SELECT
}>

export function mapEvaluacionInicialDetalle(
  row: EvaluacionInicialDetalleRow,
): EvaluacionInicialDetalleAdmin {
  return {
    id: row.id,
    inscripcionId: row.inscripcionId,
    areaId: row.areaId,
    areaNombre: row.area.nombre,
    puntaje: row.puntaje,
    observaciones: row.observaciones,
    capturadaPorId: row.capturadaPorId,
    capturadaAt: row.capturadaAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function snapshotEvaluacionInicial(row: EvaluacionInicialDetalleRow): Prisma.InputJsonValue {
  return {
    id: row.id,
    inscripcionId: row.inscripcionId,
    areaId: row.areaId,
    puntaje: row.puntaje,
    observaciones: row.observaciones,
    capturadaPorId: row.capturadaPorId,
    capturadaAt: row.capturadaAt.toISOString(),
  }
}
