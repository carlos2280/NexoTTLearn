import {
  EvaluarRepoCualitativoInput,
  EvaluarRepoCualitativoOutput,
  MantenerTurnoComprensionInput,
  MantenerTurnoComprensionOutput,
  MantenerTurnoEntrevistaInput,
  MantenerTurnoEntrevistaOutput,
} from "../ai.types"

/**
 * Contrato del provider de IA. Lo implementan `MockProvider` (vitest + dev sin
 * key) y `ClaudeProvider` (anthropic SDK real, activo en P8b).
 */
export interface IAiProvider {
  readonly providerName: "mock" | "claude"

  evaluarRepoCualitativo(input: EvaluarRepoCualitativoInput): Promise<EvaluarRepoCualitativoOutput>

  mantenerTurnoComprension(
    input: MantenerTurnoComprensionInput,
  ): Promise<MantenerTurnoComprensionOutput>

  mantenerTurnoEntrevista(
    input: MantenerTurnoEntrevistaInput,
  ): Promise<MantenerTurnoEntrevistaOutput>
}

export const AI_PROVIDER_TOKEN = Symbol("AI_PROVIDER")
