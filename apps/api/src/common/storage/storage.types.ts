import { ArchivoTipo, Prisma } from "@prisma/client"
import { z } from "zod"

/**
 * Metadata persistido en `archivos.metadata` (JSONB). El schema esta
 * discriminado por `tipo` de archivo para que cada caso de uso defina su
 * propio shape estricto y se valide en `StorageService.guardar` antes del
 * INSERT (defensa A03 — sin `as any`/`as unknown as`).
 */
export const archivoMetadataSchema = z.discriminatedUnion("tipo", [
  z
    .object({
      tipo: z.literal(ArchivoTipo.EVALUACION_INICIAL_EXCEL),
      nombreOriginal: z.string().min(1).max(255),
      cursoId: z.string().uuid(),
      subidoPorUsuarioId: z.string().uuid(),
    })
    .strict(),
])

export type ArchivoMetadata = z.infer<typeof archivoMetadataSchema>

export interface GuardarArchivoInput {
  readonly contenido: Buffer
  readonly mimeType: string
  readonly tipo: ArchivoTipo
  readonly subidoPorUsuarioId: string
  readonly metadata?: Prisma.InputJsonValue
}

export interface GuardarArchivoResult {
  readonly archivoId: string
  readonly path: string
}

export interface LeerArchivoResult {
  readonly contenido: Buffer
  readonly mimeType: string
}
