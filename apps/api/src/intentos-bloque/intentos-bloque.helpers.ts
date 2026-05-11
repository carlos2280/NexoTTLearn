import { BadRequestException, InternalServerErrorException } from "@nestjs/common"
import { type ContenidoQuiz, contenidoQuizSchema } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import type { CalculoQuizResultado, IntentoSeleccionado } from "./intentos-bloque.types"

const idempotencyKeyUuidSchema = z.string().uuid()

/**
 * Valida el header `Idempotency-Key` requerido por `POST /intentos-bloque`
 * (D-S7-D6). Patron heredado de `asignaciones.helpers.requireIdempotencyKeyUuid`.
 */
export function requireIdempotencyKeyUuid(headerValue: string | undefined): string {
  if (headerValue === undefined || !idempotencyKeyUuidSchema.safeParse(headerValue).success) {
    throw new BadRequestException({
      code: apiErrorCodes.idempotencyKeyRequerida,
      message: "El header Idempotency-Key es obligatorio y debe ser un UUID v4.",
    })
  }
  return headerValue
}

/**
 * Parsea `Bloque.contenido` (JSONB) con el shape esperado para QUIZ. Si el
 * contenido tiene un shape invalido, devuelve 500 `contenidoBloqueInvalido`
 * — la responsabilidad es del editor que insertó la fila (R-S7-2/R-S7-8).
 */
export function parsearContenidoQuiz(contenido: Prisma.JsonValue): ContenidoQuiz {
  const parsed = contenidoQuizSchema.safeParse(contenido)
  if (!parsed.success) {
    throw new InternalServerErrorException({
      code: apiErrorCodes.contenidoBloqueInvalido,
      message: "El bloque QUIZ tiene un contenido con shape invalido.",
    })
  }
  return parsed.data
}

/**
 * Algoritmo de auto-correccion QUIZ (D-S7-C2).
 *
 *   nota = (puntosObtenidos / puntosTotales) * 100      // Decimal(5,2)
 *
 * El servidor confia en `respuestaCorrectaId` del contenido del bloque y
 * compara contra la `opcionElegidaId` reportada por el usuario por cada
 * pregunta del schema. Las preguntas faltantes del body cuentan como
 * incorrectas. Las preguntas extra del body se ignoran (no afectan la nota
 * ni rompen — el body fue validado con `.strict()` y `.max(200)` en Zod).
 */
export function calcularNotaQuiz(
  contenido: ContenidoQuiz,
  respuestas: ReadonlyArray<{ readonly preguntaId: string; readonly opcionElegidaId: string }>,
): CalculoQuizResultado {
  const respuestasPorPregunta = new Map(respuestas.map((r) => [r.preguntaId, r.opcionElegidaId]))
  let puntosObtenidos = 0
  let puntosTotales = 0
  for (const pregunta of contenido.preguntas) {
    puntosTotales += pregunta.pesoPunto
    const elegida = respuestasPorPregunta.get(pregunta.id)
    if (elegida !== undefined && elegida === pregunta.respuestaCorrectaId) {
      puntosObtenidos += pregunta.pesoPunto
    }
  }
  if (puntosTotales === 0) {
    throw new InternalServerErrorException({
      code: apiErrorCodes.contenidoBloqueInvalido,
      message: "El bloque QUIZ no tiene puntos totales > 0.",
    })
  }
  const notaRaw = (puntosObtenidos / puntosTotales) * 100
  const nota = Math.round(notaRaw * 100) / 100
  return { nota, puntosObtenidos, puntosTotales }
}

/**
 * Mapper `IntentoSeleccionado -> IntentoBloqueResponse`. Convierte la nota
 * `Prisma.Decimal` a `number` y serializa la fecha como ISO 8601.
 */
export function toIntentoResponse(intento: IntentoSeleccionado): {
  readonly intentoId: string
  readonly bloqueId: string
  readonly skillId: string
  readonly cursoId: string
  readonly nota: number
  readonly esMejorIntento: boolean
  readonly versionBloque: number
  readonly estaInvalidado: boolean
  readonly fecha: string
} {
  return {
    intentoId: intento.id,
    bloqueId: intento.bloqueId,
    skillId: intento.skillId,
    cursoId: intento.cursoId,
    nota: Number(intento.nota.toString()),
    esMejorIntento: intento.esMejorIntento,
    versionBloque: intento.versionBloque,
    estaInvalidado: intento.estaInvalidado,
    fecha: intento.fecha.toISOString(),
  }
}
