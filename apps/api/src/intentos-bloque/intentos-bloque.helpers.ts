import { BadRequestException, InternalServerErrorException } from "@nestjs/common"
import {
  type ContenidoQuiz,
  type NormalizacionRespuestaCorta,
  type PreguntaQuiz,
  type RespuestaPregunta,
  contenidoQuizSchema,
} from "@nexott-learn/shared-types"
import type { Prisma } from "@prisma/client"
import { z } from "zod"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import type { CalculoQuizResultado, IntentoSeleccionado } from "./intentos-bloque.types"

const idempotencyKeyUuidSchema = z.string().uuid()

/**
 * Rango Unicode U+0300..U+036F (combining diacritical marks). Tras
 * `normalize("NFD")`, los acentos se separan en estos codepoints y se
 * eliminan con esta clase.
 */
// biome-ignore lint/suspicious/noMisleadingCharacterClass: rango intencional de combining marks (NFD).
// biome-ignore lint/complexity/useRegexLiterals: literal con \u escapes evita caracteres invisibles en la fuente.
const DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g")

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
 * Algoritmo de auto-correccion QUIZ — soporta cuatro tipos de pregunta:
 *
 *   nota = (puntosObtenidos / puntosTotales) * 100      // Decimal(5,2)
 *
 * El servidor confia en lo declarado en `Bloque.contenido` y compara contra
 * la respuesta tipada que llega del cliente. Reglas por tipo:
 *
 *  - OPCION_UNICA: acierta si la opción elegida tiene `esCorrecta=true`.
 *  - OPCION_MULTIPLE:
 *      · `puntuacionParcial=false` (default): todo o nada.
 *      · `puntuacionParcial=true`: aciertos / (aciertos esperados + extras
 *        marcadas como incorrectas), acotado en [0,1].
 *  - VERDADERO_FALSO: acierta si `valor === pregunta.correcta`.
 *  - RESPUESTA_CORTA: acierta si la respuesta normalizada coincide con alguna
 *    de las `respuestasAceptadas` aplicando la misma normalización.
 *
 * Una respuesta cuyo `tipo` no coincide con el tipo declarado de la pregunta
 * se considera respuesta inválida y suma 0 puntos (no rompe el cálculo).
 * Preguntas no respondidas también cuentan como 0 puntos.
 */
export function calcularNotaQuiz(
  contenido: ContenidoQuiz,
  respuestas: readonly RespuestaPregunta[],
): CalculoQuizResultado {
  const respuestasPorPregunta = new Map<string, RespuestaPregunta>(
    respuestas.map((r) => [r.preguntaId, r]),
  )
  let puntosObtenidos = 0
  let puntosTotales = 0
  for (const pregunta of contenido.preguntas) {
    puntosTotales += pregunta.pesoPunto
    const respuesta = respuestasPorPregunta.get(pregunta.id)
    if (respuesta === undefined) {
      continue
    }
    const fraccion = evaluarPregunta(pregunta, respuesta)
    puntosObtenidos += pregunta.pesoPunto * fraccion
  }
  if (puntosTotales === 0) {
    throw new InternalServerErrorException({
      code: apiErrorCodes.contenidoBloqueInvalido,
      message: "El bloque QUIZ no tiene puntos totales > 0.",
    })
  }
  const notaRaw = (puntosObtenidos / puntosTotales) * 100
  const nota = Math.round(notaRaw * 100) / 100
  // Redondeo de puntosObtenidos a 4 decimales para evitar IEEE-754 noise.
  const puntosObtenidosRedondeados = Math.round(puntosObtenidos * 10_000) / 10_000
  return { nota, puntosObtenidos: puntosObtenidosRedondeados, puntosTotales }
}

/**
 * Devuelve la fracción de acierto de una respuesta sobre su pregunta, en [0,1].
 * Si el tipo de la respuesta no coincide con el de la pregunta, devuelve 0.
 */
function evaluarPregunta(pregunta: PreguntaQuiz, respuesta: RespuestaPregunta): number {
  if (pregunta.tipo !== respuesta.tipo) {
    return 0
  }
  if (pregunta.tipo === "OPCION_UNICA" && respuesta.tipo === "OPCION_UNICA") {
    return evaluarOpcionUnica(pregunta, respuesta)
  }
  if (pregunta.tipo === "OPCION_MULTIPLE" && respuesta.tipo === "OPCION_MULTIPLE") {
    return evaluarOpcionMultiple(pregunta, respuesta)
  }
  if (pregunta.tipo === "VERDADERO_FALSO" && respuesta.tipo === "VERDADERO_FALSO") {
    return respuesta.valor === pregunta.correcta ? 1 : 0
  }
  if (pregunta.tipo === "RESPUESTA_CORTA" && respuesta.tipo === "RESPUESTA_CORTA") {
    return evaluarRespuestaCorta(pregunta, respuesta)
  }
  return 0
}

function evaluarOpcionUnica(
  pregunta: Extract<PreguntaQuiz, { tipo: "OPCION_UNICA" }>,
  respuesta: Extract<RespuestaPregunta, { tipo: "OPCION_UNICA" }>,
): number {
  const elegida = pregunta.opciones.find((o) => o.id === respuesta.opcionElegidaId)
  return elegida?.esCorrecta === true ? 1 : 0
}

function evaluarOpcionMultiple(
  pregunta: Extract<PreguntaQuiz, { tipo: "OPCION_MULTIPLE" }>,
  respuesta: Extract<RespuestaPregunta, { tipo: "OPCION_MULTIPLE" }>,
): number {
  const correctasIds = new Set(pregunta.opciones.filter((o) => o.esCorrecta).map((o) => o.id))
  // Filtramos elegidas que no pertenecen a las opciones declaradas: se
  // ignoran (no rompen, no suman).
  const idsValidos = new Set(pregunta.opciones.map((o) => o.id))
  const elegidasValidas = new Set(respuesta.opcionesElegidasIds.filter((id) => idsValidos.has(id)))
  if (!pregunta.puntuacionParcial) {
    return evaluarMultipleTodoONada(correctasIds, elegidasValidas)
  }
  return evaluarMultipleParcial(correctasIds, elegidasValidas)
}

function evaluarMultipleTodoONada(
  correctasIds: ReadonlySet<string>,
  elegidasValidas: ReadonlySet<string>,
): number {
  if (elegidasValidas.size !== correctasIds.size) {
    return 0
  }
  for (const id of correctasIds) {
    if (!elegidasValidas.has(id)) {
      return 0
    }
  }
  return 1
}

function evaluarMultipleParcial(
  correctasIds: ReadonlySet<string>,
  elegidasValidas: ReadonlySet<string>,
): number {
  let aciertos = 0
  let extrasIncorrectas = 0
  for (const id of elegidasValidas) {
    if (correctasIds.has(id)) {
      aciertos += 1
    } else {
      extrasIncorrectas += 1
    }
  }
  const denominador = correctasIds.size + extrasIncorrectas
  if (denominador === 0) {
    return 0
  }
  return Math.max(0, Math.min(1, aciertos / denominador))
}

function evaluarRespuestaCorta(
  pregunta: Extract<PreguntaQuiz, { tipo: "RESPUESTA_CORTA" }>,
  respuesta: Extract<RespuestaPregunta, { tipo: "RESPUESTA_CORTA" }>,
): number {
  const textoNormalizado = normalizarTexto(respuesta.texto, pregunta.normalizacion)
  const acepta = pregunta.respuestasAceptadas.some(
    (aceptada) => normalizarTexto(aceptada, pregunta.normalizacion) === textoNormalizado,
  )
  return acepta ? 1 : 0
}

/**
 * Normaliza un texto según la configuración de la pregunta RESPUESTA_CORTA.
 * Aplica trim, lowercase, NFD-quita-acentos y colapsa espacios consecutivos
 * según las flags activas.
 */
function normalizarTexto(valor: string, reglas: NormalizacionRespuestaCorta): string {
  let salida = valor
  if (reglas.trim) {
    salida = salida.trim()
  }
  if (reglas.ignorarEspaciosDobles) {
    salida = salida.replace(/\s+/g, " ")
  }
  if (reglas.ignorarMayusculas) {
    salida = salida.toLowerCase()
  }
  if (reglas.ignorarAcentos) {
    // Rango U+0300..U+036F: combining diacritical marks (tilde, acento, etc.).
    salida = salida.normalize("NFD").replace(DIACRITICOS, "")
  }
  return salida
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
