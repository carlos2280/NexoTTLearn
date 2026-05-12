import Anthropic from "@anthropic-ai/sdk"
import { Injectable, NotImplementedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AppEnv } from "../../../config/env.validation"
import {
  EvaluarRepoCualitativoInput,
  EvaluarRepoCualitativoOutput,
  MantenerTurnoComprensionInput,
  MantenerTurnoComprensionOutput,
  MantenerTurnoEntrevistaInput,
  MantenerTurnoEntrevistaOutput,
} from "../ai.types"
import { IAiProvider } from "./ai-provider.interface"

/**
 * ClaudeProvider — implementacion REAL via `@anthropic-ai/sdk` (D-S8-B1).
 *
 * En P8a queda **dormido**: el cliente se instancia (con timeout configurable
 * y maxRetries=2) pero los 3 metodos lanzan `NotImplementedException` con
 * marcador `TODO(P8b)`. El switch real a Claude ocurre en P8b junto con los
 * prompts (`prompts/*.prompt.ts`) y el manejo de errores `Anthropic.APIError`
 * (D-S8-B7).
 *
 * Mantener el shape simetrico al MockProvider permite hacer el swap por env
 * sin tocar consumidores aguas arriba.
 */
@Injectable()
export class ClaudeProvider implements IAiProvider {
  readonly providerName = "claude" as const
  // Cliente listo para usar en P8b. El `protected` evita el warning TS6133
  // (declarado pero no usado) sin tener que ejercitar la propiedad.
  protected readonly client: Anthropic

  constructor(private readonly config: ConfigService<AppEnv, true>) {
    const apiKey = this.config.get("AI_API_KEY", { infer: true })
    const timeout = this.config.get("AI_TIMEOUT_MS", { infer: true })
    if (typeof apiKey !== "string" || apiKey.length === 0) {
      // Si Zod refine hizo su trabajo nunca llegamos aqui con AI_PROVIDER=claude.
      // Fail-fast para los modos defectuosos del operador.
      throw new Error("ClaudeProvider requiere AI_API_KEY (refine de env fallido).")
    }
    this.client = new Anthropic({
      apiKey,
      timeout,
      maxRetries: 2,
    })
  }

  // biome-ignore lint/suspicious/useAwait: stub que lanza antes de hacer I/O.
  async evaluarRepoCualitativo(
    _input: EvaluarRepoCualitativoInput,
  ): Promise<EvaluarRepoCualitativoOutput> {
    throw new NotImplementedException(
      "TODO(P8b): activar ClaudeProvider.evaluarRepoCualitativo con prompt cached + parsing JSON Zod.",
    )
  }

  // biome-ignore lint/suspicious/useAwait: stub que lanza antes de hacer I/O.
  async mantenerTurnoComprension(
    _input: MantenerTurnoComprensionInput,
  ): Promise<MantenerTurnoComprensionOutput> {
    throw new NotImplementedException(
      "TODO(P8b): activar ClaudeProvider.mantenerTurnoComprension con prompt cached.",
    )
  }

  // biome-ignore lint/suspicious/useAwait: stub que lanza antes de hacer I/O.
  async mantenerTurnoEntrevista(
    _input: MantenerTurnoEntrevistaInput,
  ): Promise<MantenerTurnoEntrevistaOutput> {
    throw new NotImplementedException(
      "TODO(P8c): activar ClaudeProvider.mantenerTurnoEntrevista (rama de entrevista IA final).",
    )
  }
}
