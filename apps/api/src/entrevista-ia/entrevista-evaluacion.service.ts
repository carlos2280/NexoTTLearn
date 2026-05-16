import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import {
  AjustarEntrevistaResponse,
  AnularEntrevistaResponse,
  FinalizarEntrevistaResponse,
} from "@nexott-learn/shared-types"
import { OrigenNotaSkill, Prisma, RolUsuario } from "@prisma/client"
import { AiService } from "../common/ai/ai.service"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { NotaSkillService } from "../nota-skill/nota-skill.service"
import {
  IntentoEntrevistaSeleccionado,
  SELECT_INTENTO_ENTREVISTA_FIELDS,
  TranscripcionInterna,
} from "./entrevista-ia.types"
import { derivarEstado, parsearTranscripcionInterna } from "./visibilidad-mapper"

const IDEMPOTENCY_SCOPE_ANULAR = "intento-entrevista-ia.anular"
const HTTP_OK = 200

/**
 * Service del modulo `entrevista-ia` — sub-dominio "evaluacion y skills".
 *
 * Extraido de `EntrevistaIaService` (Fase 1.1 del plan de auditoria) para
 * separar la conversacion turn-by-turn de las operaciones que cierran el
 * intento y disparan recalculo de skills via `NotaSkillService`:
 *
 *  - `finalizar` — calcula notas finales con Claude + persiste + recalcula.
 *  - `ajustar`   — ajuste manual admin de nota global + recalculo.
 *  - `anular`    — anula intento (idempotente) + recalculo.
 *
 * Los helpers `cargarIntento` / `requerirAccesoIntento` se duplican aqui en
 * lugar de exportarlos desde el service original; el patron es el mismo
 * usado en `TransversalCapasService` (Fase 1.3) para mantener cada service
 * autocontenido sin acoplamiento cruzado.
 */
@Injectable()
export class EntrevistaEvaluacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly ai: AiService,
    private readonly notaSkill: NotaSkillService,
  ) {}

  // ===========================================================================
  // E16. POST /api/v1/intentos-entrevista-ia/:intentoId/finalizar
  // ===========================================================================

  async finalizar(input: {
    readonly intentoId: string
    readonly usuario: SesionUsuario
  }): Promise<FinalizarEntrevistaResponse> {
    const intento = await this.cargarIntento(input.intentoId)
    await this.requerirAccesoIntento(intento, input.usuario)
    const interna = parsearTranscripcionInterna(intento.transcripcionOLog)
    const estado = derivarEstado(intento, interna)
    if (estado !== "EN_PROGRESO") {
      throw new ConflictException({
        code: apiErrorCodes.conflictIntentoEntrevistaCerrado,
        message: "Solo se puede finalizar un intento EN_PROGRESO.",
      })
    }

    const resultado = await this.ai.calcularNotasFinalEntrevista({
      transcripcion: interna.turnos,
      rubricaSnapshot: interna.rubricaSnapshot,
      profundidad: intento.entrevistaIA.profundidad,
    })

    // Redistribucion D35: si el modelo omitio un area, se reparte su peso.
    const areasRubrica = intento.entrevistaIA.rubrica.map((r) => r.areaId)
    const mapaNotas = new Map(resultado.notasPorArea.map((n) => [n.areaId, n.nota]))
    const notasFinales: Array<{ areaId: string; nota: number }> = areasRubrica.map((areaId) => ({
      areaId,
      nota: mapaNotas.get(areaId) ?? 0,
    }))

    const umbral = Number(intento.entrevistaIA.umbralAprobacion.toString())
    const aprobado = resultado.notaGlobal >= umbral

    const cursoId = intento.entrevistaIA.cursoId
    const colaboradorId = intento.colaboradorId

    const internaFinal: TranscripcionInterna = {
      estado: "FINALIZADO",
      rubricaSnapshot: interna.rubricaSnapshot,
      seccionesBaseSnapshot: interna.seccionesBaseSnapshot,
      turnos: interna.turnos,
      fechaFinalizacion: new Date().toISOString(),
    }

    // Resolver skills afectadas (todas las del area de la rubrica).
    const skillsPorArea = await this.prisma.skill.findMany({
      where: {
        areaId: { in: areasRubrica },
        estado: "ACTIVA",
      },
      select: { id: true, areaId: true },
    })
    const skillsAfectadas = Array.from(new Set(skillsPorArea.map((s) => s.id)))

    await this.prisma.$transaction(async (tx) => {
      // §5.119: persistimos `estado=FINALIZADO` + `fechaFinalizacion` en columnas
      // dedicadas. `transcripcionOLog` queda como sombra para la lectura legacy.
      await tx.intentoEntrevistaIA.update({
        where: { id: input.intentoId },
        data: {
          estado: "FINALIZADO",
          fechaFinalizacion: new Date(),
          notaGlobal: new Prisma.Decimal(resultado.notaGlobal),
          aprobado,
          transcripcionOLog: internaFinal as unknown as Prisma.InputJsonValue,
        },
      })
      for (const { areaId, nota } of notasFinales) {
        await tx.intentoEntrevistaIANotaArea.upsert({
          where: {
            // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@id.
            intentoId_areaId: { intentoId: input.intentoId, areaId },
          },
          create: {
            intentoId: input.intentoId,
            areaId,
            nota: new Prisma.Decimal(nota),
          },
          update: {
            nota: new Prisma.Decimal(nota),
          },
        })
      }
      for (const skillId of skillsAfectadas) {
        await this.notaSkill.recalcularConFuentes(tx, {
          colaboradorId,
          skillId,
          cursoId,
          origen: OrigenNotaSkill.ENTREVISTA_IA,
          referencia: {
            intentoEntrevistaIaId: input.intentoId,
            evento: "FINALIZADO",
          },
        })
      }
    })

    return {
      intentoId: input.intentoId,
      notaGlobal: resultado.notaGlobal,
      aprobado,
      notasPorArea: notasFinales,
      skillsActualizadas: skillsAfectadas,
    }
  }

  // ===========================================================================
  // E19. POST /api/v1/intentos-entrevista-ia/:intentoId/ajustar
  // ===========================================================================

  async ajustar(input: {
    readonly intentoId: string
    readonly notaAjustada: number
    readonly motivo: string
    readonly usuario: SesionUsuario
  }): Promise<AjustarEntrevistaResponse> {
    const intento = await this.cargarIntento(input.intentoId)
    if (intento.anulado) {
      throw new ConflictException({
        code: apiErrorCodes.conflictIntentoEntrevistaYaAnulado,
        message: "El intento esta anulado; no se puede ajustar.",
      })
    }
    const interna = parsearTranscripcionInterna(intento.transcripcionOLog)
    const estado = derivarEstado(intento, interna)
    if (estado !== "FINALIZADO") {
      throw new ConflictException({
        code: apiErrorCodes.conflictIntentoEntrevistaNoFinalizado,
        message: "Solo se puede ajustar un intento FINALIZADO.",
      })
    }

    const cursoId = intento.entrevistaIA.cursoId
    const colaboradorId = intento.colaboradorId
    const areasRubrica = intento.entrevistaIA.rubrica.map((r) => r.areaId)
    const umbral = Number(intento.entrevistaIA.umbralAprobacion.toString())
    const aprobado = input.notaAjustada >= umbral
    const skillsPorArea = await this.prisma.skill.findMany({
      where: { areaId: { in: areasRubrica }, estado: "ACTIVA" },
      select: { id: true },
    })
    const skillsAfectadas = Array.from(new Set(skillsPorArea.map((s) => s.id)))

    await this.prisma.$transaction(async (tx) => {
      await tx.intentoEntrevistaIA.update({
        where: { id: input.intentoId },
        data: {
          notaAjustadaAdmin: new Prisma.Decimal(input.notaAjustada),
          aprobado,
          motivoAjusteOAnulacion: input.motivo,
        },
      })
      for (const skillId of skillsAfectadas) {
        await this.notaSkill.recalcularConFuentes(tx, {
          colaboradorId,
          skillId,
          cursoId,
          origen: OrigenNotaSkill.ENTREVISTA_IA,
          referencia: {
            intentoEntrevistaIaId: input.intentoId,
            evento: "AJUSTADO",
            motivoLength: input.motivo.length,
          },
        })
      }
    })

    return {
      intentoId: input.intentoId,
      notaAjustadaAdmin: input.notaAjustada,
      skillsRecalculadas: skillsAfectadas,
    }
  }

  // ===========================================================================
  // E20. POST /api/v1/intentos-entrevista-ia/:intentoId/anular
  // ===========================================================================

  async anular(input: {
    readonly intentoId: string
    readonly motivo: string
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<{ readonly response: AnularEntrevistaResponse; readonly replay: boolean }> {
    const ejecucion = await this.idempotency.runOnce<AnularEntrevistaResponse>({
      scope: IDEMPOTENCY_SCOPE_ANULAR,
      key: input.idempotencyKey,
      usuarioId: input.usuario.usuarioId,
      requestPayload: { intentoId: input.intentoId },
      ejecutor: async (tx) => {
        const intento = await tx.intentoEntrevistaIA.findUnique({
          where: { id: input.intentoId },
          select: {
            id: true,
            anulado: true,
            colaboradorId: true,
            entrevistaIA: {
              select: {
                cursoId: true,
                rubrica: { select: { areaId: true } },
              },
            },
          },
        })
        if (!intento) {
          throw new NotFoundException({
            code: apiErrorCodes.intentoEntrevistaNoEncontrado,
            message: `Intento de entrevista IA ${input.intentoId} no encontrado.`,
          })
        }
        if (intento.anulado) {
          throw new ConflictException({
            code: apiErrorCodes.conflictIntentoEntrevistaYaAnulado,
            message: "El intento ya esta anulado.",
          })
        }
        // §5.119: marcamos `estado=ANULADO` simetrico al transversal P8b.
        const r = await tx.intentoEntrevistaIA.updateMany({
          where: { id: input.intentoId, anulado: false },
          data: {
            anulado: true,
            estado: "ANULADO",
            motivoAjusteOAnulacion: input.motivo,
          },
        })
        if (r.count === 0) {
          throw new ConflictException({
            code: apiErrorCodes.conflictIntentoEntrevistaYaAnulado,
            message: "El intento ya esta anulado (race detectada).",
          })
        }
        const areasRubrica = intento.entrevistaIA.rubrica.map((rb) => rb.areaId)
        const skillsPorArea = await tx.skill.findMany({
          where: { areaId: { in: areasRubrica }, estado: "ACTIVA" },
          select: { id: true },
        })
        const skillsAfectadas = Array.from(new Set(skillsPorArea.map((s) => s.id)))
        for (const skillId of skillsAfectadas) {
          await this.notaSkill.recalcularConFuentes(tx, {
            colaboradorId: intento.colaboradorId,
            skillId,
            cursoId: intento.entrevistaIA.cursoId,
            origen: OrigenNotaSkill.ENTREVISTA_IA,
            referencia: {
              intentoEntrevistaIaId: input.intentoId,
              evento: "ANULADO",
              motivoLength: input.motivo.length,
            },
          })
        }
        return {
          status: HTTP_OK,
          body: {
            intentoId: input.intentoId,
            anulado: true as const,
            skillsRecalculadas: skillsAfectadas,
          } satisfies AnularEntrevistaResponse,
        }
      },
    })
    return { response: ejecucion.body, replay: ejecucion.replay }
  }

  // ===========================================================================
  // Helpers privados (duplicados del service original — patron Capas/Fase 1.3)
  // ===========================================================================

  private async cargarIntento(intentoId: string): Promise<IntentoEntrevistaSeleccionado> {
    const intento = await this.prisma.intentoEntrevistaIA.findUnique({
      where: { id: intentoId },
      select: SELECT_INTENTO_ENTREVISTA_FIELDS,
    })
    if (!intento) {
      throw new NotFoundException({
        code: apiErrorCodes.intentoEntrevistaNoEncontrado,
        message: `Intento de entrevista IA ${intentoId} no encontrado.`,
      })
    }
    return intento
  }

  private async requerirAccesoIntento(
    intento: IntentoEntrevistaSeleccionado,
    usuario: SesionUsuario,
  ): Promise<void> {
    if (usuario.rol === RolUsuario.ADMIN) {
      return
    }
    const colaboradorId = await this.resolverColaboradorIdParticipante(usuario)
    if (colaboradorId === null || colaboradorId !== intento.colaboradorId) {
      throw new NotFoundException({
        code: apiErrorCodes.intentoEntrevistaNoEncontrado,
        message: `Intento de entrevista IA ${intento.id} no encontrado.`,
      })
    }
  }

  private async resolverColaboradorIdParticipante(usuario: SesionUsuario): Promise<string | null> {
    const usuarioConColab = await this.prisma.usuario.findUnique({
      where: { id: usuario.usuarioId },
      select: { colaboradorId: true },
    })
    return usuarioConColab?.colaboradorId ?? null
  }
}
