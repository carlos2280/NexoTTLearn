import { Injectable } from "@nestjs/common"
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
 * MockAiProvider — respuestas deterministas para vitest y dev sin
 * `AI_API_KEY` (D-S8-B6). Nunca llama a la nube. Mantiene shape simetrico al
 * ClaudeProvider real (P8b) para que swap entre ambos no rompa los services.
 *
 *  - evaluarRepoCualitativo -> nota fija + comentario "mock cualitativa".
 *  - mantenerTurnoComprension -> 3 turnos: 2 con `siguientePregunta`, el
 *    3ro con `nota=72` y `finalizado=true`.
 *  - mantenerTurnoEntrevista -> simetrico (no se ejerce hasta P8c).
 */
@Injectable()
export class MockAiProvider implements IAiProvider {
  readonly providerName = "mock" as const

  private static readonly NOTA_CUALITATIVA_MOCK = 80
  private static readonly TURNOS_COMPRENSION_MOCK = 3
  private static readonly NOTA_COMPRENSION_MOCK = 72
  private static readonly TURNOS_ENTREVISTA_MOCK = 4
  private static readonly NOTA_ENTREVISTA_MOCK = 78

  // biome-ignore lint/suspicious/useAwait: cumple la interfaz async sin esperar I/O.
  async evaluarRepoCualitativo(
    _input: EvaluarRepoCualitativoInput,
  ): Promise<EvaluarRepoCualitativoOutput> {
    return {
      nota: MockAiProvider.NOTA_CUALITATIVA_MOCK,
      comentario: "mock cualitativa",
      confianza: "alta",
    }
  }

  // biome-ignore lint/suspicious/useAwait: cumple la interfaz async sin esperar I/O.
  async mantenerTurnoComprension(
    input: MantenerTurnoComprensionInput,
  ): Promise<MantenerTurnoComprensionOutput> {
    const esUltimoTurno = input.turnoIndex >= MockAiProvider.TURNOS_COMPRENSION_MOCK
    if (esUltimoTurno) {
      return {
        siguientePregunta: null,
        nota: MockAiProvider.NOTA_COMPRENSION_MOCK,
        finalizado: true,
      }
    }
    return {
      siguientePregunta: `mock pregunta ${input.turnoIndex + 1}`,
      nota: null,
      finalizado: false,
    }
  }

  // biome-ignore lint/suspicious/useAwait: cumple la interfaz async sin esperar I/O.
  async mantenerTurnoEntrevista(
    input: MantenerTurnoEntrevistaInput,
  ): Promise<MantenerTurnoEntrevistaOutput> {
    const esUltimoTurno = input.turnoIndex >= MockAiProvider.TURNOS_ENTREVISTA_MOCK
    return {
      respuestaIa: esUltimoTurno
        ? `mock cierre nota=${MockAiProvider.NOTA_ENTREVISTA_MOCK}`
        : `mock respuesta turno ${input.turnoIndex + 1}`,
      finalizado: esUltimoTurno,
    }
  }
}
