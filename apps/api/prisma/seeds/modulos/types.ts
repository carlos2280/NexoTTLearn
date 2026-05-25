// Tipos compartidos por los modulos pedagogicos del seed y los seeders
// que los persisten en BD.

import type { Prisma, TipoBloque } from "@prisma/client"

export interface BloqueRealDef {
  readonly tipo: TipoBloque
  readonly esEvaluable: boolean
  readonly skill?: string
  readonly idForzado?: string
  readonly contenido: Prisma.InputJsonValue
}

export interface SeccionDef {
  readonly titulo: string
  readonly skill: string
  readonly temas: string
  /** Si se define, se usan estos bloques. Si no, fallback a placeholder. */
  readonly bloques?: readonly BloqueRealDef[]
}

export interface ModuloDef {
  readonly idx: number
  readonly titulo: string
  readonly descripcion: string
  readonly secciones: readonly SeccionDef[]
}

/** Modulo + secciones ya persistidos en BD (ids reales). Lo devuelve el
 *  seeder de modulos para que el seeder del curso pueda construir el plan
 *  de estudio y las habilitaciones por curso. */
export interface ModuloPersistido {
  readonly idx: number
  readonly moduloId: string
  readonly secciones: ReadonlyArray<{
    readonly seccionId: string
    readonly titulo: string
  }>
}
