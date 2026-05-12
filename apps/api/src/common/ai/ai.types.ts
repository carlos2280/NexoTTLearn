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

export type ProfundidadEntrevistaIa = "JUNIOR" | "SEMI_SENIOR" | "SENIOR"

export type ConfianzaAi = "alta" | "media" | "baja"

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
