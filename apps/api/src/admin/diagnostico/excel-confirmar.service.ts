import { Injectable, NotFoundException } from "@nestjs/common"
import type { ExcelConfirmarResponse } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  EVALUACION_INICIAL_DETALLE_SELECT,
  type EvaluacionInicialDetalleRow,
  snapshotEvaluacionInicial,
} from "../inscripciones/inscripciones-evaluaciones-iniciales.mapper"
import { ENTIDAD_TIPO_EVALUACION_INICIAL } from "../inscripciones/inscripciones-evaluaciones-iniciales.types"
import { ExcelUploadCacheService } from "./excel-upload-cache.service"

// =============================================================================
// CONFIRMAR CARGA EXCEL
// PR 3b · upsert EvaluacionInicial por (inscripcionId, areaId) usando los
// puntajes parseados en el preview. Idempotente: el uploadId se invalida tras
// exito (re-confirmar = 404).
// MAESTRO §7.5 · la EvaluacionInicial NO afecta agregados de notas de modulo,
// asi que NO disparamos recalculo de brechas. Solo LogActividad por fila.
// =============================================================================

interface ConfirmarInput {
  readonly cursoId: string
  readonly uploadId: string
  readonly actorId: string
}

@Injectable()
export class ExcelConfirmarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: ExcelUploadCacheService,
  ) {}

  async confirmar({ cursoId, uploadId, actorId }: ConfirmarInput): Promise<ExcelConfirmarResponse> {
    const entry = this.cache.get(uploadId, cursoId)
    if (!entry) {
      throw new NotFoundException("uploadId expirado o inexistente")
    }

    // Mapa email -> inscripcionId para resolver filas validas a su FK.
    const inscripciones = await this.prisma.inscripcion.findMany({
      where: { cursoId, estado: "ACTIVA" },
      select: {
        id: true,
        participante: { select: { email: true } },
      },
    })
    const inscripcionPorEmail = new Map<string, string>()
    for (const i of inscripciones) {
      inscripcionPorEmail.set(i.participante.email.toLowerCase(), i.id)
    }

    let aplicadas = 0
    let ignoradas = 0

    for (const fila of entry.filas) {
      if (fila.estado === "error") {
        ignoradas += 1
        continue
      }
      const inscripcionId = inscripcionPorEmail.get(fila.email.toLowerCase())
      if (!inscripcionId) {
        // El email estaba en el preview pero la inscripcion ya no es ACTIVA:
        // se ignora silencioso (no rompe el lote).
        ignoradas += 1
        continue
      }

      const notasValidas = fila.notas.filter(
        (n): n is { areaId: string; valor: number } => n.valor !== null,
      )
      if (notasValidas.length === 0) {
        ignoradas += 1
        continue
      }

      for (const nota of notasValidas) {
        await this.upsertUna(inscripcionId, nota.areaId, nota.valor, actorId)
      }
      aplicadas += 1
    }

    // Invalidar uploadId tras exito (idempotencia).
    this.cache.delete(uploadId)

    return { aplicadas, ignoradas }
  }

  // Replica el patron de inscripciones-evaluaciones-iniciales.service.ts:upsert,
  // sin requireAreaDelCurso/requireMutable porque el preview ya valido el
  // contexto (curso existe, email->inscripcion activa). Se mantiene la
  // transaccion + LogActividad por fila para auditoria.
  private async upsertUna(
    inscripcionId: string,
    areaId: string,
    puntaje: number,
    actorId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existente = await tx.evaluacionInicial.findUnique({
        // biome-ignore lint/style/useNamingConvention: where compuesto generado por Prisma a partir de @@unique([inscripcionId, areaId])
        where: { inscripcionId_areaId: { inscripcionId, areaId } },
        select: EVALUACION_INICIAL_DETALLE_SELECT,
      })

      let resultado: EvaluacionInicialDetalleRow
      if (existente) {
        resultado = await tx.evaluacionInicial.update({
          // biome-ignore lint/style/useNamingConvention: where compuesto generado por Prisma a partir de @@unique([inscripcionId, areaId])
          where: { inscripcionId_areaId: { inscripcionId, areaId } },
          data: { puntaje, capturadaPorId: actorId },
          select: EVALUACION_INICIAL_DETALLE_SELECT,
        })
      } else {
        resultado = await tx.evaluacionInicial.create({
          data: { inscripcionId, areaId, puntaje, capturadaPorId: actorId },
          select: EVALUACION_INICIAL_DETALLE_SELECT,
        })
      }

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_EVALUACION_INICIAL,
          entidadId: resultado.id,
          valorAntes: existente ? snapshotEvaluacionInicial(existente) : Prisma.JsonNull,
          valorDespues: snapshotEvaluacionInicial(resultado),
        },
      })
    })
  }
}
