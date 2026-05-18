import { Injectable } from "@nestjs/common"
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

  // -------------------------------------------------------------------------
  // P8c — entrevista IA final (D-S8-D1, D-S8-D4)
  // -------------------------------------------------------------------------

  private static readonly NOTA_ENTREVISTA_IA_GLOBAL_MOCK = 75
  private static readonly NOTA_ENTREVISTA_IA_AREA_MOCK = 75
  // Numero de turnos del colaborador tras el que la IA cierra (incluye iniciar
  // como turno 0). Permite tests deterministas: turno 1..2 -> pregunta;
  // turno >=3 -> finalizado=true.
  private static readonly TURNOS_ENTREVISTA_IA_MAX = 3

  // biome-ignore lint/suspicious/useAwait: cumple la interfaz async sin esperar I/O.
  async iniciarEntrevista(_input: IniciarEntrevistaInput): Promise<IniciarEntrevistaOutput> {
    return { primeraPregunta: "¿Mock pregunta 1?" }
  }

  mantenerTurnoEntrevistaIa(
    input: MantenerTurnoEntrevistaIaInput,
  ): Promise<MantenerTurnoEntrevistaIaOutput> {
    // Contamos los turnos del colaborador. La transcripcion incluye el
    // primer mensaje del asistente (la primera pregunta) y luego pares.
    const turnosColaborador = input.transcripcion.filter((t) => t.rol === "COLABORADOR").length
    if (turnosColaborador >= MockAiProvider.TURNOS_ENTREVISTA_IA_MAX) {
      return Promise.resolve({
        respuestaIa: "mock cierre — gracias por participar",
        finalizado: true,
      })
    }
    return Promise.resolve({
      respuestaIa: `mock pregunta ${turnosColaborador + 1}`,
      finalizado: false,
    })
  }

  calcularNotasFinalEntrevista(
    input: CalcularNotasFinalEntrevistaInput,
  ): Promise<CalcularNotasFinalEntrevistaOutput> {
    // Lee la rubrica snapshot para producir una nota por cada area declarada.
    const areas = obtenerAreasDeRubrica(input.rubricaSnapshot)
    const notasPorArea = areas.map((areaId) => ({
      areaId,
      nota: MockAiProvider.NOTA_ENTREVISTA_IA_AREA_MOCK,
    }))
    return Promise.resolve({
      notaGlobal: MockAiProvider.NOTA_ENTREVISTA_IA_GLOBAL_MOCK,
      notasPorArea,
      reporte: {
        fortalezas: [
          "mock: explico con claridad el flujo principal del curso",
          "mock: identifico correctamente las dependencias entre modulos",
        ],
        mejoras: [
          "mock: profundizar en patrones de testing avanzados",
          "mock: practicar mas el despliegue end-to-end",
        ],
        justificacion:
          "mock: respuesta generada por el proveedor mock. Cubre el shape exigido por el contrato pero no refleja la transcripcion real.",
      },
    })
  }
}

/**
 * Extrae los `areaId` declarados en la rubrica snapshot. Tolerante a forma
 * legacy: si la rubrica viene vacia o invalida, devuelve lista vacia (el
 * caller debe aplicar la regla de redistribucion D35).
 */
function obtenerAreasDeRubrica(rubricaSnapshot: Record<string, unknown>): string[] {
  const areas = rubricaSnapshot.areas
  if (!Array.isArray(areas)) {
    return []
  }
  return areas
    .map((a) => {
      if (a !== null && typeof a === "object" && "areaId" in a) {
        const v = (a as Record<string, unknown>).areaId
        return typeof v === "string" ? v : null
      }
      return null
    })
    .filter((v): v is string => v !== null)
}
