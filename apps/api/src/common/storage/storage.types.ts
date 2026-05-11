import { ArchivoTipo, Prisma } from "@prisma/client"

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
