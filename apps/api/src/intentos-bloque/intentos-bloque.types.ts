import { Prisma } from "@prisma/client"

/**
 * Select Prisma reutilizable para devolver el shape estable de `IntentoBloque`
 * a traves de los endpoints. Mantiene los campos sensibles y evita filtrar
 * `respuestas` en listados (D-S7-D2 omite el body del intento en respuestas).
 */
export const SELECT_INTENTO_FIELDS = {
  id: true,
  bloqueId: true,
  skillId: true,
  cursoId: true,
  colaboradorId: true,
  nota: true,
  esMejorIntento: true,
  versionBloque: true,
  estaInvalidado: true,
  fecha: true,
  preguntasFalladas: true,
} as const satisfies Prisma.IntentoBloqueSelect

export type IntentoSeleccionado = Prisma.IntentoBloqueGetPayload<{
  select: typeof SELECT_INTENTO_FIELDS
}>

/**
 * Resultado interno del calculo de un intento QUIZ (D-S7-C2). El service
 * normaliza la nota a `Prisma.Decimal` antes de persistir.
 *
 * `preguntasFalladasIds` (B-extra.2 punto 4): ids de las preguntas que no
 * se acertaron. Para `CODIGO_PREGUNTAS` se devuelve siempre array vacio.
 */
export interface CalculoQuizResultado {
  readonly nota: number
  readonly puntosObtenidos: number
  readonly puntosTotales: number
  readonly preguntasFalladasIds: readonly string[]
}
