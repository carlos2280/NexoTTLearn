import type { ContenidoEmbebido, SeccionAdminItem } from "@nexott-learn/shared-types"
import type { Prisma, TipoContenido } from "@prisma/client"

// Forma minima de la fila Prisma necesaria para construir un ContenidoEmbebido.
// Tiparla asi (en lugar de Contenido completo) deja claro que selects exige el
// service y previene leer campos no incluidos. NO incluye `contenido` (Json
// grande) — el GET de secciones devuelve solo cabeceras.
export type ContenidoEmbebidoRow = {
  id: string
  seccionId: string
  tipo: TipoContenido
  titulo: string
  orden: number
  metadata: Prisma.JsonValue
  archivado: boolean
  creadoEn: Date
  actualizadoEn: Date
}

export type SeccionAdminRow = {
  id: string
  moduloId: string
  titulo: string
  orden: number
  creadoEn: Date
  actualizadoEn: Date
  contenidos: readonly ContenidoEmbebidoRow[]
}

/**
 * Extrae duracionEstimada del Json `metadata`. La duracion vive dentro de
 * metadata (ver doc 03-ESTRUCTURA-CONTENIDO.md, ej. LECTURA: metadata.duracionEstimada).
 * Devuelve null si metadata es null, no es objeto, o el campo no es numero
 * entero >= 0. Asi el front lee duracion sin parsear el Json.
 */
function extraerDuracionEstimada(metadata: Prisma.JsonValue): number | null {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null
  }
  const valor = (metadata as Record<string, unknown>).duracionEstimada
  if (typeof valor !== "number" || !Number.isInteger(valor) || valor < 0) {
    return null
  }
  return valor
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

export function mapContenidoEmbebidoAItem(row: ContenidoEmbebidoRow): ContenidoEmbebido {
  return {
    id: row.id,
    seccionId: row.seccionId,
    tipo: row.tipo,
    titulo: row.titulo,
    orden: row.orden,
    duracionEstimada: extraerDuracionEstimada(row.metadata),
    metadata: normalizarMetadata(row.metadata),
    archivado: row.archivado,
    creadoEn: row.creadoEn.toISOString(),
    actualizadoEn: row.actualizadoEn.toISOString(),
  }
}

/**
 * Convierte una fila Prisma de Seccion (con contenidos embebidos) en el item
 * que consume el frontend. Funcion pura, sin efectos.
 */
export function mapSeccionAItem(row: SeccionAdminRow): SeccionAdminItem {
  return {
    id: row.id,
    moduloId: row.moduloId,
    titulo: row.titulo,
    orden: row.orden,
    creadoEn: row.creadoEn.toISOString(),
    actualizadoEn: row.actualizadoEn.toISOString(),
    contenidos: row.contenidos.map(mapContenidoEmbebidoAItem),
  }
}
