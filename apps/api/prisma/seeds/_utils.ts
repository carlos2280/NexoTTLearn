// Helpers reutilizables del seed-frontend: id-builders, logging,
// validadores y builders de bloques pedagogicos (PARRAFO, TIP, QUIZ, ...).

import { validarContenidoBloque } from "@nexott-learn/shared-types"
import { type Prisma, TipoBloque } from "@prisma/client"

import {
  MS_POR_DIA,
  P_ADMIN,
  P_ASIG,
  P_BLOQUE,
  P_CLIENTE,
  P_CURSO,
  P_MODULO,
  P_PART,
  P_PLAN,
  P_SECCION,
  P_SKILL,
} from "./_config"

// ============================================================================
// Pad helpers + id builders
// ============================================================================

export function pad2(n: number): string {
  return n.toString(16).padStart(2, "0")
}
export function pad3(n: number): string {
  return n.toString(16).padStart(3, "0")
}
export function pad4(n: number): string {
  return n.toString(16).padStart(4, "0")
}

export const adminId = (i: number): string => `${P_ADMIN}${pad2(i)}`
export const partId = (i: number): string => `${P_PART}${pad2(i)}`
export const clienteId = (i: number): string => `${P_CLIENTE}${pad2(i)}`
export const cursoId = (i: number): string => `${P_CURSO}${pad2(i)}`
export const moduloId = (i: number): string => `${P_MODULO}${pad2(i)}`
export const seccionId = (i: number): string => `${P_SECCION}${pad3(i)}`
export const bloqueId = (i: number): string => `${P_BLOQUE}${pad4(i)}`
export const asigId = (i: number): string => `${P_ASIG}${pad2(i)}`
export const planId = (i: number): string => `${P_PLAN}${pad2(i)}`
export const skillId = (i: number): string => `${P_SKILL}${pad3(i)}`

// ============================================================================
// Fecha helpers
// ============================================================================

export function dateNDaysAgo(n: number): Date {
  return new Date(Date.now() - n * MS_POR_DIA)
}
export function dateNDaysAhead(n: number): Date {
  return new Date(Date.now() + n * MS_POR_DIA)
}
export function ymd(date: Date): Date {
  const iso = date.toISOString().slice(0, 10)
  return new Date(`${iso}T00:00:00.000Z`)
}
export function log(msg: string): void {
  process.stdout.write(`[seed-frontend] ${msg}\n`)
}

// ============================================================================
// Builders de bloques placeholder
// ============================================================================

export function validarOExplotar(
  tipo: TipoBloque,
  contenido: unknown,
  ctx: string,
): Prisma.InputJsonValue {
  const parsed = validarContenidoBloque(tipo, contenido)
  if (!parsed.success) {
    throw new Error(
      `[seed-frontend] contenido invalido para ${tipo} en ${ctx}: ${JSON.stringify(parsed.error.issues)}`,
    )
  }
  return contenido as Prisma.InputJsonValue
}

export function placeholderParrafo(temas: string, ctx: string): Prisma.InputJsonValue {
  const html = `<p><strong>Contenido pedagogico en preparacion.</strong></p><p>Esta seccion cubrira: ${temas}</p><p class="text-text-tertiary"><em>Iteracion 2 del curso — el contenido real se publicara cuando el modulo este pulido.</em></p>`
  const textoPlano = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const palabras = textoPlano.split(" ").filter(Boolean).length
  return validarOExplotar(
    TipoBloque.PARRAFO,
    { html, textoPlano, tiempoLecturaMin: Math.max(1, Math.ceil(palabras / 200)) },
    ctx,
  )
}

// ----------------------------------------------------------------------------
// Builders de contenido real (validados con Zod del shared-types)
// ----------------------------------------------------------------------------

export function buildParrafo(html: string, ctx: string): Prisma.InputJsonValue {
  const textoPlano = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const palabras = textoPlano.split(" ").filter(Boolean).length
  return validarOExplotar(
    TipoBloque.PARRAFO,
    { html, textoPlano, tiempoLecturaMin: Math.max(1, Math.ceil(palabras / 200)) },
    ctx,
  )
}

export function buildTip(
  variante: "info" | "warning" | "exito",
  html: string,
  ctx: string,
): Prisma.InputJsonValue {
  return validarOExplotar(TipoBloque.TIP, { variante, html }, ctx)
}

export function buildCodigoIlustrativo(
  lenguaje: string,
  codigo: string,
  descripcion: string,
  ctx: string,
): Prisma.InputJsonValue {
  return validarOExplotar(TipoBloque.CODIGO_ILUSTRATIVO, { lenguaje, codigo, descripcion }, ctx)
}

export function buildRecurso(
  subtipo: "enlace" | "adjunto",
  url: string,
  titulo: string,
  descripcion: string,
  ctx: string,
): Prisma.InputJsonValue {
  return validarOExplotar(
    TipoBloque.RECURSO,
    { subtipo, url, titulo, descripcion, abrirNuevaPestana: subtipo === "enlace" },
    ctx,
  )
}

/**
 * Bloque DIAGRAMA (Excalidraw embebido).
 *
 * Para el seed sembramos solo el placeholder con un texto que invita al
 * admin a editar — el diagrama real se construye desde la UI del admin
 * con la libreria visual. Los `elements` siguen el shape de Excalidraw:
 * un objeto por figura/texto/flecha con sus props.
 */
export function buildDiagrama(
  elements: readonly Record<string, unknown>[],
  altText: string,
  caption: string | undefined,
  ctx: string,
): Prisma.InputJsonValue {
  return validarOExplotar(
    TipoBloque.DIAGRAMA,
    caption ? { elements, altText, caption } : { elements, altText },
    ctx,
  )
}

export interface OpcionQuiz {
  readonly id: string
  readonly texto: string
  readonly esCorrecta: boolean
}

interface PreguntaBase {
  readonly id: string
  readonly enunciado: string
  readonly explicacion?: string
}
export interface PreguntaOpcionUnica extends PreguntaBase {
  readonly tipo?: "OPCION_UNICA"
  readonly opciones: readonly OpcionQuiz[]
}
export interface PreguntaOpcionMultiple extends PreguntaBase {
  readonly tipo: "OPCION_MULTIPLE"
  readonly opciones: readonly OpcionQuiz[]
  readonly puntuacionParcial?: boolean
}
export interface PreguntaVerdaderoFalso extends PreguntaBase {
  readonly tipo: "VERDADERO_FALSO"
  readonly correcta: boolean
}
export interface NormalizacionRespuestaCorta {
  readonly trim: boolean
  readonly ignorarMayusculas: boolean
  readonly ignorarAcentos: boolean
  readonly ignorarEspaciosDobles: boolean
}
export interface PreguntaRespuestaCorta extends PreguntaBase {
  readonly tipo: "RESPUESTA_CORTA"
  readonly respuestasAceptadas: readonly string[]
  readonly normalizacion?: NormalizacionRespuestaCorta
}
export type PreguntaQuiz =
  | PreguntaOpcionUnica
  | PreguntaOpcionMultiple
  | PreguntaVerdaderoFalso
  | PreguntaRespuestaCorta

function normalizarPregunta(p: PreguntaQuiz): Record<string, unknown> {
  const tipo = p.tipo ?? "OPCION_UNICA"
  const base: Record<string, unknown> = {
    id: p.id,
    enunciado: p.enunciado,
    pesoPunto: 1,
    tipo,
  }
  if (p.explicacion !== undefined) base.explicacion = p.explicacion
  if (tipo === "OPCION_UNICA") {
    base.opciones = (p as PreguntaOpcionUnica).opciones
    return base
  }
  if (tipo === "OPCION_MULTIPLE") {
    const multi = p as PreguntaOpcionMultiple
    base.opciones = multi.opciones
    base.puntuacionParcial = multi.puntuacionParcial ?? false
    return base
  }
  if (tipo === "VERDADERO_FALSO") {
    base.correcta = (p as PreguntaVerdaderoFalso).correcta
    return base
  }
  const corta = p as PreguntaRespuestaCorta
  base.respuestasAceptadas = corta.respuestasAceptadas
  if (corta.normalizacion) base.normalizacion = corta.normalizacion
  return base
}

export function buildQuiz(preguntas: readonly PreguntaQuiz[], ctx: string): Prisma.InputJsonValue {
  return validarOExplotar(
    TipoBloque.QUIZ,
    {
      intentosMax: 3,
      solucionVisible: "tras_intento",
      ordenAleatorio: false,
      notaMinima: 70,
      preguntas: preguntas.map(normalizarPregunta),
    },
    ctx,
  )
}

export function buildCodigoPreguntas(
  lenguaje: "javascript" | "typescript" | "python",
  enunciado: string,
  esqueletoInicial: string,
  ctx: string,
): Prisma.InputJsonValue {
  return validarOExplotar(
    TipoBloque.CODIGO_PREGUNTAS,
    { lenguaje, enunciado, esqueletoInicial, tiempoLimiteSeg: 30 },
    ctx,
  )
}

export interface TestStdin {
  readonly id: string
  readonly descripcion: string
  readonly entrada: string
  readonly salidaEsperada: string
  readonly visible: boolean
}

export function buildCodigoTests(
  codigoPreguntasId: string,
  solucionReferencia: string,
  tests: readonly TestStdin[],
  ctx: string,
): Prisma.InputJsonValue {
  return validarOExplotar(
    TipoBloque.CODIGO_TESTS,
    { codigoPreguntasId, solucionReferencia, tests },
    ctx,
  )
}

export function placeholderQuiz(skill: string, ctx: string): Prisma.InputJsonValue {
  return validarOExplotar(
    TipoBloque.QUIZ,
    {
      intentosMax: 3,
      solucionVisible: "tras_intento",
      ordenAleatorio: false,
      notaMinima: 70,
      preguntas: [
        {
          id: "wip-1",
          tipo: "OPCION_UNICA",
          enunciado: `<p><em>Pregunta en preparacion.</em> Cuando este modulo se rellene, aqui se evaluara: <strong>${skill}</strong>.</p>`,
          explicacion: "Placeholder — la explicacion real llegara con el contenido del modulo.",
          pesoPunto: 1,
          opciones: [
            { id: "a", texto: "Continuar (placeholder valido)", esCorrecta: true },
            { id: "b", texto: "Marcar otra opcion", esCorrecta: false },
          ],
        },
      ],
    },
    ctx,
  )
}
