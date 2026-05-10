import type { ContenidoAdminItem } from "@nexott-learn/shared-types"
import type { Prisma, TipoContenido } from "@prisma/client"

// Forma minima de fila Prisma necesaria para construir un ContenidoAdminItem.
// Incluye `contenido` (Json grande) — el endpoint de detalle SI lo devuelve,
// a diferencia del embebido en SeccionAdminItem.
export type ContenidoAdminRow = {
  id: string
  seccionId: string
  tipo: TipoContenido
  titulo: string
  orden: number
  contenido: Prisma.JsonValue
  metadata: Prisma.JsonValue
  archivado: boolean
  creadoEn: Date
  actualizadoEn: Date
}

/**
 * Normaliza metadata a un objeto plano (o null) que coincida con el schema
 * zod `z.record(z.unknown()).nullable()`. Si Prisma devuelve un array o un
 * primitivo en metadata (no deberia, pero el tipo Json lo permite), se
 * descarta y se devuelve null.
 */
function normalizarMetadata(metadata: Prisma.JsonValue): Record<string, unknown> | null {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null
  }
  return metadata as Record<string, unknown>
}

/**
 * Convierte una fila Prisma de Contenido en el item que consume el frontend.
 * Funcion pura, sin efectos. `contenido` se pasa tal cual (ya es Json valido).
 */
export function mapContenidoAItem(row: ContenidoAdminRow): ContenidoAdminItem {
  return {
    id: row.id,
    seccionId: row.seccionId,
    tipo: row.tipo,
    titulo: row.titulo,
    orden: row.orden,
    contenido: row.contenido,
    metadata: normalizarMetadata(row.metadata),
    archivado: row.archivado,
    creadoEn: row.creadoEn.toISOString(),
    actualizadoEn: row.actualizadoEn.toISOString(),
  }
}
