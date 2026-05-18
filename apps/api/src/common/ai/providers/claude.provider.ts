import Anthropic from "@anthropic-ai/sdk"
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AppEnv } from "../../../config/env.validation"
import { apiErrorCodes } from "../../errors/api-error.codes"
import {
  AiRespuestaEstructurada,
  CalcularNotasFinalEntrevistaInput,
  CalcularNotasFinalEntrevistaOutput,
  EvaluarRepoCualitativoInput,
  EvaluarRepoCualitativoOutput,
  IniciarEntrevistaInput,
  IniciarEntrevistaOutput,
  MantenerTurnoComprensionInput,
  MantenerTurnoComprensionOutput,
  MantenerTurnoEntrevistaIaInput,
  MantenerTurnoEntrevistaIaOutput,
  MantenerTurnoEntrevistaInput,
  MantenerTurnoEntrevistaOutput,
  aiRespuestaEstructuradaSchema,
  iniciarEntrevistaResponseSchema,
  notasFinalEntrevistaSchema,
  turnoEntrevistaResponseSchema,
} from "../ai.types"
import { construirMensajesComprension } from "../prompts/comprension.prompt"
import { construirMensajesCualitativa } from "../prompts/cualitativa.prompt"
import { construirMensajesEntrevista } from "../prompts/entrevista-ia.prompt"
import { IAiProvider } from "./ai-provider.interface"

/**
 * ClaudeProvider — implementacion real via `@anthropic-ai/sdk` (D-S8-B1/B4/B7).
 *
 * - Activa prompt caching via header `anthropic-beta` (D-S8-B4).
 * - Verifica accesibilidad del repo con HEAD antes de gastar tokens (R-S8-6).
 * - Mapea errores Anthropic.APIError a HTTPException segun D-S8-B7.
 * - Logging: solo metadatos (model, tokens, latencyMs). NUNCA prompt ni
 *   respuesta (R-S8-10).
 *
 * El modelo se resuelve aguas arriba por `AiService.resolveModel(profundidad)`;
 * aqui solo se respeta `AI_MAX_TOKENS` del config.
 */
const PROMPT_CACHING_BETA = "prompt-caching-2024-07-31"
const BACKOFF_MS_PRIMERO = 1000
const BACKOFF_MS_SEGUNDO = 3000
const STATUS_RATE_LIMITED = 429
const STATUS_AUTH = 401
const STATUS_BAD_REQUEST = 400
const STATUS_SERVER_MIN = 500
const STATUS_SERVER_MAX_INCLUSIVE = 599
const HEAD_TIMEOUT_MS = 5000
const HEAD_STATUS_ERROR_MIN = 400
const FENCE_JSON_REGEX = /```(?:json)?\s*([\s\S]*?)```/

@Injectable()
export class ClaudeProvider implements IAiProvider {
  readonly providerName = "claude" as const
  private readonly logger = new Logger(ClaudeProvider.name)
  private readonly client: Anthropic
  private readonly maxTokens: number

  constructor(private readonly config: ConfigService<AppEnv, true>) {
    const apiKey = this.config.get("AI_API_KEY", { infer: true })
    const timeout = this.config.get("AI_TIMEOUT_MS", { infer: true })
    if (typeof apiKey !== "string" || apiKey.length === 0) {
      throw new Error("ClaudeProvider requiere AI_API_KEY (refine de env fallido).")
    }
    this.maxTokens = this.config.get("AI_MAX_TOKENS", { infer: true })
    this.client = new Anthropic({
      apiKey,
      timeout,
      maxRetries: 2,
      defaultHeaders: { "anthropic-beta": PROMPT_CACHING_BETA },
    })
  }

  async evaluarRepoCualitativo(
    input: EvaluarRepoCualitativoInput,
  ): Promise<EvaluarRepoCualitativoOutput> {
    await this.verificarRepoAccesible(input.repoUrl)
    const mensajes = construirMensajesCualitativa({
      repoUrl: input.repoUrl,
      profundidad: input.profundidad,
    })
    const modelo = this.resolverModelo(input.profundidad)
    const respuesta = await this.invocarClaude(modelo, mensajes.system, mensajes.user)
    const nota = typeof respuesta.nota === "number" ? respuesta.nota : 0
    return {
      nota,
      comentario: respuesta.comentario ?? "",
      confianza: respuesta.confianza ?? "media",
    }
  }

  async mantenerTurnoComprension(
    input: MantenerTurnoComprensionInput,
  ): Promise<MantenerTurnoComprensionOutput> {
    await this.verificarRepoAccesible(input.repoUrl)
    const mensajes = construirMensajesComprension({
      repoUrl: input.repoUrl,
      profundidad: input.profundidad,
      turnoIndex: input.turnoIndex,
      transcripcionPrevia: input.transcripcionPrevia,
    })
    const modelo = this.resolverModelo(input.profundidad)
    const respuesta = await this.invocarClaude(modelo, mensajes.system, mensajes.user)
    const finalizado = respuesta.finalizado === true
    return {
      siguientePregunta: finalizado ? null : (respuesta.siguientePregunta ?? null),
      nota: finalizado ? (respuesta.nota ?? null) : null,
      finalizado,
    }
  }

  // biome-ignore lint/suspicious/useAwait: la rama entrevista IA legacy queda obsoleta — usar iniciar/turno/cierre.
  async mantenerTurnoEntrevista(
    _input: MantenerTurnoEntrevistaInput,
  ): Promise<MantenerTurnoEntrevistaOutput> {
    throw new InternalServerErrorException({
      code: apiErrorCodes.iaNoDisponible,
      message: "Use iniciarEntrevista / mantenerTurnoEntrevistaIa / calcularNotasFinalEntrevista.",
    })
  }

  // -------------------------------------------------------------------------
  // P8c — Entrevista IA final (D-S8-D1, D-S8-D4)
  // -------------------------------------------------------------------------

  async iniciarEntrevista(input: IniciarEntrevistaInput): Promise<IniciarEntrevistaOutput> {
    const mensajes = construirMensajesEntrevista({
      modo: "iniciar",
      profundidad: input.profundidad,
      rubricaSnapshot: input.rubricaSnapshot,
      seccionesBaseSnapshot: input.seccionesBaseSnapshot,
    })
    const modelo = this.resolverModelo(input.profundidad)
    const respuesta = await this.invocarClaudeRaw(modelo, mensajes.system, mensajes.user)
    const parsed = iniciarEntrevistaResponseSchema.safeParse(respuesta)
    if (!parsed.success) {
      throw new BadRequestException({
        code: apiErrorCodes.iaRespuestaMalformada,
        message: "IA devolvio shape inesperado al iniciar entrevista.",
      })
    }
    return { primeraPregunta: parsed.data.primeraPregunta }
  }

  async mantenerTurnoEntrevistaIa(
    input: MantenerTurnoEntrevistaIaInput,
  ): Promise<MantenerTurnoEntrevistaIaOutput> {
    const mensajes = construirMensajesEntrevista({
      modo: "turno",
      profundidad: input.profundidad,
      rubricaSnapshot: input.rubricaSnapshot,
      seccionesBaseSnapshot: input.seccionesBaseSnapshot,
      transcripcion: input.transcripcion,
    })
    const modelo = this.resolverModelo(input.profundidad)
    const respuesta = await this.invocarClaudeRaw(modelo, mensajes.system, mensajes.user)
    const parsed = turnoEntrevistaResponseSchema.safeParse(respuesta)
    if (!parsed.success) {
      throw new BadRequestException({
        code: apiErrorCodes.iaRespuestaMalformada,
        message: "IA devolvio shape inesperado en turno entrevista.",
      })
    }
    return { respuestaIa: parsed.data.respuestaIa, finalizado: parsed.data.finalizado }
  }

  async calcularNotasFinalEntrevista(
    input: CalcularNotasFinalEntrevistaInput,
  ): Promise<CalcularNotasFinalEntrevistaOutput> {
    const mensajes = construirMensajesEntrevista({
      modo: "cierre",
      profundidad: input.profundidad,
      rubricaSnapshot: input.rubricaSnapshot,
      transcripcion: input.transcripcion,
    })
    const modelo = this.resolverModelo(input.profundidad)
    const respuesta = await this.invocarClaudeRaw(modelo, mensajes.system, mensajes.user)
    const parsed = notasFinalEntrevistaSchema.safeParse(respuesta)
    if (!parsed.success) {
      throw new BadRequestException({
        code: apiErrorCodes.iaRespuestaMalformada,
        message: "IA devolvio shape inesperado al calcular notas finales.",
      })
    }
    return {
      notaGlobal: parsed.data.notaGlobal,
      notasPorArea: parsed.data.notasPorArea,
      reporte: parsed.data.reporte,
    }
  }

  /**
   * R-S8-6 — pre-validacion: HEAD al repo antes de pagar tokens. Si responde
   * 4xx/5xx asumimos que Claude tampoco podra leerlo. 422 con codigo
   * REPO_NO_ACCESIBLE para que el caller (job worker o admin) actue.
   */
  private async verificarRepoAccesible(repoUrl: string): Promise<void> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS)
    try {
      const response = await fetch(repoUrl, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      })
      if (response.status >= HEAD_STATUS_ERROR_MIN) {
        throw new UnprocessableEntityException({
          code: apiErrorCodes.repoNoAccesible,
          message: `El repo no es accesible publicamente (status ${response.status}).`,
        })
      }
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error
      }
      // Network error / DNS / abort -> tratamos como no accesible.
      throw new UnprocessableEntityException({
        code: apiErrorCodes.repoNoAccesible,
        message: "El repo no es accesible (fallo de red o timeout en HEAD).",
      })
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Wrapper unificado que maneja:
   *  - backoff 1s/3s para 5xx (2 reintentos).
   *  - mapeo de errores SDK a HTTPException (D-S8-B7).
   *  - logging de metadatos sin PII (R-S8-10).
   *  - parsing JSON validado con Zod (`aiRespuestaEstructuradaSchema`).
   */
  /**
   * Resuelve el modelo Claude segun profundidad del curso (D-S8-B3). Honra
   * `AI_MODEL_OVERRIDE` cuando esta seteado (R-S8-12: documentado para uso en
   * staging o pruebas A/B). Igual semantica que `AiService.resolveModel`.
   */
  private resolverModelo(profundidad: EvaluarRepoCualitativoInput["profundidad"]): string {
    const override = this.config.get("AI_MODEL_OVERRIDE", { infer: true })
    if (typeof override === "string" && override.length > 0) {
      return override
    }
    switch (profundidad) {
      case "JUNIOR":
        return this.config.get("AI_MODEL_JUNIOR", { infer: true })
      case "SENIOR":
        return this.config.get("AI_MODEL_SENIOR", { infer: true })
      default:
        return this.config.get("AI_MODEL_SEMI_SENIOR", { infer: true })
    }
  }

  private async invocarClaude(
    modelo: string,
    system: ReturnType<typeof construirMensajesCualitativa>["system"],
    user: string,
  ): Promise<AiRespuestaEstructurada> {
    const inicio = Date.now()
    const intentos: readonly number[] = [0, BACKOFF_MS_PRIMERO, BACKOFF_MS_SEGUNDO]
    let ultimoServerError: unknown = null

    for (const espera of intentos) {
      if (espera > 0) {
        await this.esperar(espera)
      }
      try {
        return await this.intentarLlamada(modelo, system, user, inicio)
      } catch (error: unknown) {
        const reintentable = this.manejarErrorClaude(error, inicio)
        if (!reintentable) {
          // Si manejarErrorClaude devuelve false significa que ya lanzo una
          // excepcion (rate-limit, auth, bad request). Aqui no llegamos.
          throw error
        }
        ultimoServerError = error
      }
    }

    this.logger.error(
      `Claude no disponible tras reintentos latency_ms=${Date.now() - inicio} detalle=${ultimoServerError instanceof Error ? ultimoServerError.message : "desconocido"}`,
    )
    throw new ServiceUnavailableException({
      code: apiErrorCodes.iaNoDisponible,
      message: "IA no disponible tras reintentos.",
    })
  }

  private async intentarLlamada(
    modelo: string,
    system: ReturnType<typeof construirMensajesCualitativa>["system"],
    user: string,
    inicio: number,
  ): Promise<AiRespuestaEstructurada> {
    const respuesta = await this.client.messages.create({
      model: modelo,
      // biome-ignore lint/style/useNamingConvention: parametro del SDK Anthropic.
      max_tokens: this.maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    })
    const usage = respuesta.usage
    this.logger.log(
      `Claude OK model=${respuesta.model} tokens_in=${usage.input_tokens} tokens_out=${usage.output_tokens} cache_read=${usage.cache_read_input_tokens ?? 0} cache_creation=${usage.cache_creation_input_tokens ?? 0} latency_ms=${Date.now() - inicio}`,
    )
    return this.parsearRespuesta(respuesta.content)
  }

  /**
   * Variante de `invocarClaude` que devuelve el JSON crudo (sin imponer el
   * schema `aiRespuestaEstructuradaSchema`). Los metodos P8c validan despues
   * con su propio schema Zod dedicado (D-S8-D4). Reutiliza el mismo wrapper
   * de errores/backoff/log.
   */
  private async invocarClaudeRaw(
    modelo: string,
    system: ReturnType<typeof construirMensajesCualitativa>["system"],
    user: string,
  ): Promise<unknown> {
    const inicio = Date.now()
    const intentos: readonly number[] = [0, BACKOFF_MS_PRIMERO, BACKOFF_MS_SEGUNDO]
    let ultimoServerError: unknown = null

    for (const espera of intentos) {
      if (espera > 0) {
        await this.esperar(espera)
      }
      try {
        return await this.intentarLlamadaRaw(modelo, system, user, inicio)
      } catch (error: unknown) {
        const reintentable = this.manejarErrorClaude(error, inicio)
        if (!reintentable) {
          throw error
        }
        ultimoServerError = error
      }
    }

    this.logger.error(
      `Claude no disponible tras reintentos latency_ms=${Date.now() - inicio} detalle=${ultimoServerError instanceof Error ? ultimoServerError.message : "desconocido"}`,
    )
    throw new ServiceUnavailableException({
      code: apiErrorCodes.iaNoDisponible,
      message: "IA no disponible tras reintentos.",
    })
  }

  private async intentarLlamadaRaw(
    modelo: string,
    system: ReturnType<typeof construirMensajesCualitativa>["system"],
    user: string,
    inicio: number,
  ): Promise<unknown> {
    const respuesta = await this.client.messages.create({
      model: modelo,
      // biome-ignore lint/style/useNamingConvention: parametro del SDK Anthropic.
      max_tokens: this.maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    })
    const usage = respuesta.usage
    this.logger.log(
      `Claude OK model=${respuesta.model} tokens_in=${usage.input_tokens} tokens_out=${usage.output_tokens} cache_read=${usage.cache_read_input_tokens ?? 0} cache_creation=${usage.cache_creation_input_tokens ?? 0} latency_ms=${Date.now() - inicio}`,
    )
    return this.parsearRespuestaCrudo(respuesta.content)
  }

  private parsearRespuestaCrudo(content: Anthropic.Messages.Message["content"]): unknown {
    const textoCompleto = content
      .filter((c): c is Anthropic.Messages.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim()
    if (textoCompleto.length === 0) {
      throw new BadRequestException({
        code: apiErrorCodes.iaRespuestaMalformada,
        message: "IA devolvio respuesta vacia.",
      })
    }
    const jsonExtraido = this.extraerJsonEnvuelto(textoCompleto)
    try {
      return JSON.parse(jsonExtraido)
    } catch {
      throw new BadRequestException({
        code: apiErrorCodes.iaRespuestaMalformada,
        message: "IA devolvio JSON invalido.",
      })
    }
  }

  /**
   * Decide que hacer con un error de Claude. Devuelve `true` si es un error
   * de servidor reintenable (5xx o no-SDK). Lanza una excepcion HTTP si es
   * un error terminal (429, 401, 400). Mantiene el switch fuera del bucle de
   * reintentos para reducir complejidad cognitiva del caller.
   */
  private manejarErrorClaude(error: unknown, inicio: number): boolean {
    // Excepciones ya construidas por nuestro parseo (BadRequest, etc.) deben
    // propagarse intactas, NO reintenarse: el resultado del modelo no va a
    // mejorar repitiendo la misma llamada.
    if (
      error instanceof BadRequestException ||
      error instanceof InternalServerErrorException ||
      error instanceof UnprocessableEntityException ||
      error instanceof ServiceUnavailableException
    ) {
      throw error
    }
    if (!(error instanceof Anthropic.APIError)) {
      // Errores no SDK (TypeError, abort, etc.) -> reintenamos.
      return true
    }
    const status = error.status ?? 0
    if (status === STATUS_RATE_LIMITED) {
      throw new ServiceUnavailableException({
        code: apiErrorCodes.iaTemporalmenteSaturada,
        message: "IA temporalmente saturada (rate limit).",
      })
    }
    if (status === STATUS_AUTH) {
      this.logger.error(`Claude AUTH error status=${status} latency_ms=${Date.now() - inicio}`)
      throw new InternalServerErrorException({
        code: apiErrorCodes.iaCredencialesInvalidas,
        message: "Credenciales de IA invalidas.",
      })
    }
    if (status === STATUS_BAD_REQUEST) {
      throw new BadRequestException({
        code: apiErrorCodes.iaRespuestaMalformada,
        message: "Peticion a IA malformada o respuesta no parseable.",
      })
    }
    if (status >= STATUS_SERVER_MIN && status <= STATUS_SERVER_MAX_INCLUSIVE) {
      return true
    }
    // Otros status no clasificados -> tratamos como reintenable para no perder
    // disponibilidad ante variantes nuevas del SDK.
    return true
  }

  private parsearRespuesta(
    content: Anthropic.Messages.Message["content"],
  ): AiRespuestaEstructurada {
    const textoCompleto = content
      .filter((c): c is Anthropic.Messages.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim()
    if (textoCompleto.length === 0) {
      throw new BadRequestException({
        code: apiErrorCodes.iaRespuestaMalformada,
        message: "IA devolvio respuesta vacia.",
      })
    }
    const jsonExtraido = this.extraerJsonEnvuelto(textoCompleto)
    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(jsonExtraido)
    } catch {
      throw new BadRequestException({
        code: apiErrorCodes.iaRespuestaMalformada,
        message: "IA devolvio JSON invalido.",
      })
    }
    const result = aiRespuestaEstructuradaSchema.safeParse(parsedJson)
    if (!result.success) {
      throw new BadRequestException({
        code: apiErrorCodes.iaRespuestaMalformada,
        message: "IA devolvio JSON con shape inesperado.",
      })
    }
    return result.data
  }

  /**
   * Algunos modelos envuelven JSON entre fences ```json ... ```. Esta
   * normalizacion lo extrae si esta presente; si no, devuelve el texto tal cual.
   */
  private extraerJsonEnvuelto(texto: string): string {
    const fenceMatch = texto.match(FENCE_JSON_REGEX)
    if (fenceMatch && typeof fenceMatch[1] === "string") {
      return fenceMatch[1].trim()
    }
    return texto
  }

  private esperar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
