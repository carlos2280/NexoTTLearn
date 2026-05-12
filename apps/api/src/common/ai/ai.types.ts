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
 *    (D-S8-B7). En P8a solo MockProvider esta activo, ClaudeProvider lanza
 *    `NotImplementedException` con TODO(P8b).
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

export interface EvaluarRepoCualitativoInput {
  readonly repoUrl: string
  readonly profundidad: ProfundidadEntrevistaIa
}

export interface EvaluarRepoCualitativoOutput {
  readonly nota: number
  readonly comentario: string
  readonly confianza: ConfianzaAi
}

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
