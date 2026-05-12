import {
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
} from "../ai.types"

/**
 * Contrato del provider de IA. Lo implementan `MockProvider` (vitest + dev sin
 * key) y `ClaudeProvider` (anthropic SDK real, activo en P8b/P8c).
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

  // Slice 8 P8c — Entrevista IA final (D-S8-D1/D4).
  iniciarEntrevista(input: IniciarEntrevistaInput): Promise<IniciarEntrevistaOutput>

  mantenerTurnoEntrevistaIa(
    input: MantenerTurnoEntrevistaIaInput,
  ): Promise<MantenerTurnoEntrevistaIaOutput>

  calcularNotasFinalEntrevista(
    input: CalcularNotasFinalEntrevistaInput,
  ): Promise<CalcularNotasFinalEntrevistaOutput>
}

export const AI_PROVIDER_TOKEN = Symbol("AI_PROVIDER")
