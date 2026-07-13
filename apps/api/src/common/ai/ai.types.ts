/**
 * Tipos publicos del dominio `AiModule` (Slice 8 — D-S8-B1).
 *
 * El `AiService` enruta a un provider concreto (mock o claude) segun la env
 * `AI_PROVIDER`. Cada metodo del provider devuelve una respuesta estructurada
 * con `nota`, `comentario`, `confianza` o `siguientePregunta`/`finalizado`
 * dependiendo del flujo.
 *
 * Convenciones:
 *  - Los providers nunca lanzan errores tipados de la nube directamente; los
 *    envuelven en `BadRequestException` / `ServiceUnavailableException`
 *    (D-S8-B7). Mock y Claude estan ambos plenamente implementados; el switch
 *    lo resuelve la factory del `AiModule` segun `AI_PROVIDER`.
 *  - Nunca se incluye PII ni transcripciones en los tipos: viajan en los
 *    payloads de entrada/salida y los services aguas arriba deciden si
 *    persistirlas.
 */

import { z } from "zod"

export type ProfundidadEntrevistaIa = "JUNIOR" | "SEMI_SENIOR" | "SENIOR"

export type ConfianzaAi = "alta" | "media" | "baja"

/**
 * Bloque `system` enviado a Claude. Cuando viene con `cache_control` se
 * marca como cacheable (D-S8-B4). El SDK acepta este shape directamente en
 * `messages.create({ system: [...] })`.
 */
export interface AiSystemBlock {
  readonly type: "text"
  readonly text: string
  // biome-ignore lint/style/useNamingConvention: shape exigido por el SDK de Anthropic (`cache_control`).
  readonly cache_control?: { readonly type: "ephemeral" }
}

/**
 * Esquema Zod para la respuesta estructurada que Claude devuelve cuando
 * se le pide evaluar el repo o un turno de comprension. El prompt instruye
 * explicitamente al modelo a responder con JSON conformando este shape.
 *
 * Mantener el schema aqui (no en shared-types) porque solo el backend lo
 * valida; el frontend nunca recibe el payload crudo.
 */
export const aiRespuestaEstructuradaSchema = z
  .object({
    nota: z.number().min(0).max(100).nullable(),
    comentario: z.string().max(4000).optional(),
    confianza: z.enum(["alta", "media", "baja"]).optional(),
    siguientePregunta: z.string().max(4000).nullable().optional(),
    finalizado: z.boolean().optional(),
  })
  .strict()

export type AiRespuestaEstructurada = z.infer<typeof aiRespuestaEstructuradaSchema>

/**
 * Schema del informe cualitativo estructurado que Claude devuelve al evaluar un
 * repo (Slice 8 Fase 2). Espeja el precedente `reporteEvaluadorIaSchema` de la
 * entrevista IA, pero orientado al repo entregado.
 *
 * La clave de consistencia es `porDimension`: la IA puntua las **skills que el
 * transversal declara** (ejes fijos), no una nota al aire — asi dos repos son
 * comparables. El `veredicto` (apto / necesita_ajustes) NO viaja aqui: se deriva
 * aguas arriba de `nota >= umbralAprobacion` para evitar que la IA se
 * autocontradiga (nota alta con veredicto negativo).
 */
export const aiDimensionEvaluadaSchema = z
  .object({
    dimension: z.string().min(1).max(200),
    nota: z.number().min(0).max(100).nullable(),
    comentario: z.string().max(1000),
  })
  .strict()

/**
 * Verificación de un criterio de la "Lista a evaluar" del admin. `cumple` en 3
 * estados honestos; `null` cuando la IA no pudo verificarlo. Se reconcilia
 * contra la lista declarada (`reconciliarCriterios`).
 *
 * Gemelo de `cumplimientoCriterioSchema` en shared-types (capas.schema.ts): ese
 * es el contrato write+read; este valida el output crudo de la IA. Deben tener
 * la misma forma — si cambias el enum o los límites de uno, actualiza el otro.
 */
export const aiCumplimientoCriterioSchema = z
  .object({
    criterio: z.string().min(1).max(200),
    cumple: z.enum(["cumple", "parcial", "no"]).nullable(),
    evidencia: z.string().max(500),
  })
  .strict()

export const aiInformeCualitativoSchema = z
  .object({
    nota: z.number().min(0).max(100).nullable(),
    confianza: z.enum(["alta", "media", "baja"]),
    resumen: z.string().min(1).max(2000),
    queReviso: z.string().min(1).max(500),
    queNoReviso: z.string().min(1).max(500),
    porDimension: z.array(aiDimensionEvaluadaSchema).max(30),
    fortalezas: z.array(z.string().min(1).max(300)).max(5),
    aReforzar: z
      .array(
        z
          .object({
            que: z.string().min(1).max(300),
            sugerencia: z.string().min(1).max(500),
          })
          .strict(),
      )
      .max(5),
    // La IA puede omitirlo (transversal sin lista); se reconcilia aguas arriba.
    cumplimientoCriterios: z.array(aiCumplimientoCriterioSchema).max(15).optional(),
  })
  .strict()

export type AiInformeCualitativo = z.infer<typeof aiInformeCualitativoSchema>

export interface EvaluarRepoCualitativoInput {
  /**
   * Contenido del repositorio ya descargado y empaquetado (RepoFetchService).
   * Se pasa el texto, no la URL: la IA razona sobre el código real, no sobre un
   * enlace que no puede abrir.
   */
  readonly contenidoRepo: string
  readonly profundidad: ProfundidadEntrevistaIa
  /**
   * Ejes a puntuar = skills que el transversal declara (`TransversalSkill` →
   * `Skill.etiquetaVisible`). El motor reconcilia la respuesta de la IA contra
   * esta lista para que el informe cubra siempre exactamente estos ejes.
   */
  readonly dimensiones: readonly string[]
  /**
   * Lista "a evaluar" que redactó el admin (`ProyectoTransversal.criteriosEvaluacion`).
   * A diferencia de las skills (ejes con nota), son criterios concretos que la
   * IA verifica ítem por ítem (`cumplimientoCriterios`). Vacío = sin lista.
   */
  readonly criterios?: readonly string[]
}

/**
 * Informe cualitativo estructurado que el motor entrega al job. Es exactamente
 * el shape validado por `aiInformeCualitativoSchema` (fuente única): `nota` es
 * `null` cuando la IA no pudo evaluar el repo (el job trata ese caso como no
 * evaluado y deja el intento para el admin) y `porDimension` ya viene
 * reconciliado contra las `dimensiones` de entrada.
 */
export type EvaluarRepoCualitativoOutput = AiInformeCualitativo

export interface MantenerTurnoComprensionInput {
  readonly repoUrl: string
  readonly profundidad: ProfundidadEntrevistaIa
  readonly turnoIndex: number
  readonly transcripcionPrevia: ReadonlyArray<{
    readonly rol: "asistente" | "colaborador"
    readonly texto: string
  }>
}

export interface MantenerTurnoComprensionOutput {
  readonly siguientePregunta: string | null
  readonly nota: number | null
  readonly finalizado: boolean
}

export interface MantenerTurnoEntrevistaInput {
  readonly profundidad: ProfundidadEntrevistaIa
  readonly turnoIndex: number
  readonly mensajeColaborador: string
}

export interface MantenerTurnoEntrevistaOutput {
  readonly respuestaIa: string
  readonly finalizado: boolean
}

/**
 * Entrada del flujo P8c entrevista IA — se reutiliza para los 3 metodos
 * (iniciar, mantener turno, calcular notas final). Mantiene el snapshot de la
 * rubrica y secciones base congelado al iniciar el intento (R-S8-3).
 */
export interface TurnoTranscripcion {
  readonly rol: "ASISTENTE" | "COLABORADOR"
  readonly mensaje: string
  readonly timestamp: string
}

export interface IniciarEntrevistaInput {
  readonly rubricaSnapshot: Record<string, unknown>
  readonly seccionesBaseSnapshot: Record<string, unknown>
  readonly profundidad: ProfundidadEntrevistaIa
}

export interface IniciarEntrevistaOutput {
  readonly primeraPregunta: string
}

export interface MantenerTurnoEntrevistaIaInput {
  readonly transcripcion: readonly TurnoTranscripcion[]
  readonly rubricaSnapshot: Record<string, unknown>
  readonly seccionesBaseSnapshot: Record<string, unknown>
  readonly profundidad: ProfundidadEntrevistaIa
}

export interface MantenerTurnoEntrevistaIaOutput {
  readonly respuestaIa: string
  readonly finalizado: boolean
}

export interface CalcularNotasFinalEntrevistaInput {
  readonly transcripcion: readonly TurnoTranscripcion[]
  readonly rubricaSnapshot: Record<string, unknown>
  readonly profundidad: ProfundidadEntrevistaIa
}

export interface ReporteEvaluadorIa {
  readonly fortalezas: readonly string[]
  readonly mejoras: readonly string[]
  readonly justificacion: string
}

export interface CalcularNotasFinalEntrevistaOutput {
  readonly notaGlobal: number
  readonly notasPorArea: readonly { readonly areaId: string; readonly nota: number }[]
  readonly reporte: ReporteEvaluadorIa
}

/**
 * Schemas Zod para validar la respuesta JSON estructurada que el modelo entrega
 * en cada metodo P8c. Cualquier desvio del shape ⇒ `BadRequestException`
 * `iaRespuestaMalformada` aguas arriba (defensa en profundidad — D-S8-B7).
 */
export const turnoEntrevistaResponseSchema = z
  .object({
    respuestaIa: z.string().min(1).max(8000),
    finalizado: z.boolean(),
  })
  .strict()

export type TurnoEntrevistaResponse = z.infer<typeof turnoEntrevistaResponseSchema>

export const iniciarEntrevistaResponseSchema = z
  .object({
    primeraPregunta: z.string().min(1).max(2000),
  })
  .strict()

export type IniciarEntrevistaResponse = z.infer<typeof iniciarEntrevistaResponseSchema>

export const reporteEvaluadorIaSchema = z
  .object({
    fortalezas: z.array(z.string().min(1).max(200)).min(1).max(5),
    mejoras: z.array(z.string().min(1).max(200)).min(0).max(5),
    justificacion: z.string().min(1).max(800),
  })
  .strict()

export const notasFinalEntrevistaSchema = z
  .object({
    notaGlobal: z.number().min(0).max(100),
    notasPorArea: z
      .array(
        z
          .object({
            areaId: z.string().uuid(),
            nota: z.number().min(0).max(100),
          })
          .strict(),
      )
      .min(1),
    reporte: reporteEvaluadorIaSchema,
  })
  .strict()

export type NotasFinalEntrevistaResponse = z.infer<typeof notasFinalEntrevistaSchema>
